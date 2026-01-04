import { databaseService } from '../../../shared/database/database.service';
import { POI, POICategory, BoundingBox } from '../types';
import {
  logger,
  createWriteQueue,
  getTileKey,
  getTilesCoveringBbox,
  Tile,
} from '../../../shared/utils';

interface POIRow {
  id: string;
  type: string;
  category: string;
  name: string | null;
  latitude: number;
  longitude: number;
  tags_json: string | null;
  fetched_at: string;
  expires_at: string;
  is_downloaded?: number; // 1 if downloaded for offline, 0 or null otherwise
}

interface FavoriteRow {
  poi_id: string;
  user_note: string | null;
  favorited_at: string;
}

interface CacheTileRow {
  tile_key: string;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  fetched_at: string;
  expires_at: string;
}

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Convert a POI row from database to POI object
 */
function rowToPOI(row: POIRow): POI {
  return {
    id: row.id,
    type: row.type as 'node' | 'way' | 'relation',
    category: row.category as POICategory,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    tags: row.tags_json ? JSON.parse(row.tags_json) : {},
    isDownloaded: row.is_downloaded === 1,
  };
}

// Write queue to serialize database operations and prevent transaction conflicts
const writeQueue = createWriteQueue();

/**
 * POI repository for database operations
 */
export const poiRepository = {
  CACHE_DURATION_MS,

  /**
   * Check if an area (bounding box) is cached and valid
   */
  async isTileCached(bbox: BoundingBox): Promise<boolean> {
    const tileKey = getTileKey(bbox);
    const now = new Date().toISOString();

    const tile = await databaseService.queryFirst<CacheTileRow>(
      `SELECT * FROM poi_cache_tiles WHERE tile_key = ? AND expires_at > ?`,
      [tileKey, now]
    );

    return tile !== null;
  },

  /**
   * Get POIs from cache within a bounding box
   * Includes is_downloaded flag for each POI
   */
  async getPOIsInBounds(bbox: BoundingBox): Promise<POI[]> {
    const now = new Date().toISOString();

    const rows = await databaseService.query<POIRow>(
      `SELECT id, type, category, name, latitude, longitude, tags_json, fetched_at, expires_at, is_downloaded
       FROM pois
       WHERE latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?
         AND expires_at > ?`,
      [bbox.south, bbox.north, bbox.west, bbox.east, now]
    );

    return rows.map(rowToPOI);
  },

  /**
   * Get POIs by category (optionally within bounds)
   */
  async getPOIsByCategory(
    category: POICategory,
    bbox?: BoundingBox
  ): Promise<POI[]> {
    const now = new Date().toISOString();

    if (bbox) {
      const rows = await databaseService.query<POIRow>(
        `SELECT * FROM pois
         WHERE category = ?
           AND latitude >= ? AND latitude <= ?
           AND longitude >= ? AND longitude <= ?
           AND expires_at > ?`,
        [category, bbox.south, bbox.north, bbox.west, bbox.east, now]
      );
      return rows.map(rowToPOI);
    }

    const rows = await databaseService.query<POIRow>(
      `SELECT * FROM pois WHERE category = ? AND expires_at > ?`,
      [category, now]
    );
    return rows.map(rowToPOI);
  },

  /**
   * Save POIs to cache (upsert)
   * Uses batch inserts for performance (100 POIs per batch = ~10x faster)
   * Uses a queue to serialize writes and prevent transaction conflicts
   */
  async savePOIs(pois: POI[], bbox: BoundingBox): Promise<void> {
    if (pois.length === 0) return;

    // Queue the caching operation to prevent concurrent transaction conflicts
    const cacheOperation = async (): Promise<void> => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      const fetchedAt = now.toISOString();
      const expiresAtStr = expiresAt.toISOString();
      const tileKey = getTileKey(bbox);

      const db = await databaseService.getDatabase();

      // Batch insert POIs in groups of 500 for performance
      // Modern SQLite supports up to 32766 params, with 9 columns = 3640 max rows
      const BATCH_SIZE = 500;

      for (let i = 0; i < pois.length; i += BATCH_SIZE) {
        const batch = pois.slice(i, i + BATCH_SIZE);

        // Build batch INSERT query
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const values: (string | number | null)[] = [];

        for (const poi of batch) {
          values.push(
            poi.id,
            poi.type,
            poi.category,
            poi.name,
            poi.latitude,
            poi.longitude,
            JSON.stringify(poi.tags),
            fetchedAt,
            expiresAtStr
          );
        }

        await db.runAsync(
          `INSERT INTO pois (id, type, category, name, latitude, longitude, tags_json, fetched_at, expires_at)
           VALUES ${placeholders}
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             tags_json = excluded.tags_json,
             fetched_at = excluded.fetched_at,
             expires_at = excluded.expires_at`,
          values
        );
      }

      // Mark tile as cached
      await db.runAsync(
        `INSERT INTO poi_cache_tiles (tile_key, min_lat, max_lat, min_lon, max_lon, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tile_key) DO UPDATE SET
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
        [
          tileKey,
          bbox.south,
          bbox.north,
          bbox.west,
          bbox.east,
          fetchedAt,
          expiresAtStr,
        ]
      );
    };

    // Queue the write operation
    return writeQueue.enqueue(cacheOperation, (error) => {
      logger.warn('cache', 'POI caching error (queued)', error);
    });
  },

  /**
   * Mark a tile as cached (even if empty)
   * Prevents infinite refetch loop for regions with no POIs or that timed out
   */
  async markTileAsCached(bbox: BoundingBox): Promise<void> {
    const markOperation = async (): Promise<void> => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      const tileKey = getTileKey(bbox);

      const db = await databaseService.getDatabase();
      await db.runAsync(
        `INSERT INTO poi_cache_tiles (tile_key, min_lat, max_lat, min_lon, max_lon, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tile_key) DO UPDATE SET
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
        [
          tileKey,
          bbox.south,
          bbox.north,
          bbox.west,
          bbox.east,
          now.toISOString(),
          expiresAt.toISOString(),
        ]
      );
    };

    return writeQueue.enqueue(markOperation, (error) => {
      logger.warn('cache', 'Mark tile cached error', error);
    });
  },

  /**
   * Clean expired cache entries
   * Uses queue to prevent transaction conflicts
   */
  async cleanExpiredCache(): Promise<void> {
    const cleanOperation = async (): Promise<void> => {
      const now = new Date().toISOString();
      const db = await databaseService.getDatabase();

      // Delete expired tiles
      await db.runAsync(
        `DELETE FROM poi_cache_tiles WHERE expires_at <= ?`,
        [now]
      );

      // Delete expired POIs (except favorited ones)
      await db.runAsync(
        `DELETE FROM pois
         WHERE expires_at <= ?
           AND id NOT IN (SELECT poi_id FROM poi_favorites)`,
        [now]
      );
    };

    // Queue the write operation
    return writeQueue.enqueue(cleanOperation, (error) => {
      logger.warn('cache', 'Cache cleanup error', error);
    });
  },

  // ==================== Viewport-Based Tile Loading ====================

  /**
   * Get all tiles covering a bounding box (for viewport-based loading)
   */
  getTilesCoveringBbox(bbox: BoundingBox): BoundingBox[] {
    return getTilesCoveringBbox(bbox).map(tile => ({
      south: tile.south,
      north: tile.north,
      west: tile.west,
      east: tile.east
    }));
  },

  /**
   * Get only the tiles that are NOT cached for a bounding box
   * Used for viewport-based loading to only fetch missing data
   * OPTIMIZED: Uses single batch query instead of N sequential queries
   */
  async getUncachedTiles(bbox: BoundingBox): Promise<BoundingBox[]> {
    const tiles = getTilesCoveringBbox(bbox);
    if (tiles.length === 0) return [];

    const now = new Date().toISOString();
    const tileKeys = tiles.map(t => t.key);

    // SINGLE batch query instead of N sequential queries
    const placeholders = tileKeys.map(() => '?').join(',');
    const cachedTiles = await databaseService.query<{ tile_key: string }>(
      `SELECT tile_key FROM poi_cache_tiles WHERE tile_key IN (${placeholders}) AND expires_at > ?`,
      [...tileKeys, now]
    );

    const cachedKeys = new Set(cachedTiles.map(t => t.tile_key));

    // Return tiles that are NOT in the cached set
    return tiles
      .filter(t => !cachedKeys.has(t.key))
      .map(t => ({
        south: t.south,
        north: t.north,
        west: t.west,
        east: t.east
      }));
  },

  /**
   * Check which tiles are cached (returns cached tile keys)
   */
  async getCachedTileKeys(bbox: BoundingBox): Promise<Set<string>> {
    const tiles = getTilesCoveringBbox(bbox);
    const now = new Date().toISOString();

    if (tiles.length === 0) return new Set();

    const tileKeys = tiles.map(t => t.key);
    const placeholders = tileKeys.map(() => '?').join(',');

    const cachedRows = await databaseService.query<{ tile_key: string }>(
      `SELECT tile_key FROM poi_cache_tiles WHERE tile_key IN (${placeholders}) AND expires_at > ?`,
      [...tileKeys, now]
    );

    return new Set(cachedRows.map(r => r.tile_key));
  },

  // ==================== Favorites Operations ====================

  /**
   * Add a POI to favorites
   */
  async addFavorite(poiId: string, note?: string): Promise<void> {
    const now = new Date().toISOString();

    await databaseService.execute(
      `INSERT INTO poi_favorites (poi_id, user_note, favorited_at)
       VALUES (?, ?, ?)
       ON CONFLICT(poi_id) DO UPDATE SET user_note = excluded.user_note`,
      [poiId, note || null, now]
    );

    // Extend the POI expiry to never expire (set far future)
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await databaseService.execute(
      `UPDATE pois SET expires_at = ? WHERE id = ?`,
      [farFuture, poiId]
    );
  },

  /**
   * Remove a POI from favorites
   */
  async removeFavorite(poiId: string): Promise<void> {
    await databaseService.execute(
      `DELETE FROM poi_favorites WHERE poi_id = ?`,
      [poiId]
    );
  },

  /**
   * Get all favorited POIs
   */
  async getFavorites(): Promise<POI[]> {
    const rows = await databaseService.query<POIRow & FavoriteRow>(
      `SELECT p.*, f.user_note, f.favorited_at
       FROM pois p
       INNER JOIN poi_favorites f ON p.id = f.poi_id
       ORDER BY f.favorited_at DESC`
    );

    return rows.map(rowToPOI);
  },

  /**
   * Check if a POI is favorited
   */
  async isFavorite(poiId: string): Promise<boolean> {
    const result = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM poi_favorites WHERE poi_id = ?`,
      [poiId]
    );
    return (result?.count ?? 0) > 0;
  },

  /**
   * Get favorite statuses for multiple POIs (batch operation)
   */
  async getFavoriteStatuses(poiIds: string[]): Promise<Set<string>> {
    if (poiIds.length === 0) return new Set();

    const placeholders = poiIds.map(() => '?').join(',');
    const rows = await databaseService.query<{ poi_id: string }>(
      `SELECT poi_id FROM poi_favorites WHERE poi_id IN (${placeholders})`,
      poiIds
    );

    return new Set(rows.map((r) => r.poi_id));
  },

  /**
   * Update the note for a favorited POI
   */
  async updateFavoriteNote(poiId: string, note: string): Promise<void> {
    await databaseService.execute(
      `UPDATE poi_favorites SET user_note = ? WHERE poi_id = ?`,
      [note, poiId]
    );
  },

  /**
   * Get the note for a favorited POI
   */
  async getFavoriteNote(poiId: string): Promise<string | null> {
    const result = await databaseService.queryFirst<{ user_note: string | null }>(
      `SELECT user_note FROM poi_favorites WHERE poi_id = ?`,
      [poiId]
    );
    return result?.user_note ?? null;
  },

  // ==================== Downloaded POI Operations ====================

  /**
   * Get downloaded (permanent) POIs within bounds
   * Downloaded POIs have is_downloaded = 1 and never expire
   */
  async getDownloadedPOIsInBounds(bbox: BoundingBox): Promise<POI[]> {
    const rows = await databaseService.query<POIRow>(
      `SELECT id, type, category, name, latitude, longitude, tags_json, fetched_at, expires_at, is_downloaded
       FROM pois
       WHERE is_downloaded = 1
         AND latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?`,
      [bbox.south, bbox.north, bbox.west, bbox.east]
    );

    return rows.map(rowToPOI);
  },

  /**
   * Check if area has any downloaded POIs
   */
  async hasDownloadedPOIsInBounds(bbox: BoundingBox): Promise<boolean> {
    const result = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM pois
       WHERE is_downloaded = 1
         AND latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?
       LIMIT 1`,
      [bbox.south, bbox.north, bbox.west, bbox.east]
    );

    return (result?.count ?? 0) > 0;
  },

  /**
   * Get POIs in bounds with preference for downloaded
   * Returns downloaded POIs first (instant), then cached POIs
   */
  async getPOIsInBoundsWithDownloadPriority(bbox: BoundingBox): Promise<POI[]> {
    const now = new Date().toISOString();

    // Query both downloaded and cached POIs, with downloaded ones marked
    const rows = await databaseService.query<POIRow>(
      `SELECT id, type, category, name, latitude, longitude, tags_json, fetched_at, expires_at, is_downloaded
       FROM pois
       WHERE latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?
         AND (is_downloaded = 1 OR expires_at > ?)
       ORDER BY is_downloaded DESC`,
      [bbox.south, bbox.north, bbox.west, bbox.east, now]
    );

    // Deduplicate by ID, preferring downloaded
    const poiMap = new Map<string, POI>();
    for (const row of rows) {
      if (!poiMap.has(row.id) || row.is_downloaded === 1) {
        poiMap.set(row.id, rowToPOI(row));
      }
    }

    return Array.from(poiMap.values());
  },

  /**
   * Get downloaded POI count by category in bounds
   */
  async getDownloadedPOICountsByCategory(
    bbox: BoundingBox
  ): Promise<Record<POICategory, number>> {
    const rows = await databaseService.query<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count FROM pois
       WHERE is_downloaded = 1
         AND latitude >= ? AND latitude <= ?
         AND longitude >= ? AND longitude <= ?
       GROUP BY category`,
      [bbox.south, bbox.north, bbox.west, bbox.east]
    );

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.category] = row.count;
    }

    return counts as Record<POICategory, number>;
  },
};
