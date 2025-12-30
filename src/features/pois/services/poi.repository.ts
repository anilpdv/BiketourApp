import { databaseService } from '../../../shared/database/database.service';
import { POI, POICategory, BoundingBox } from '../types';

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

// Grid size for tile keys (in degrees) - approximately 11km at equator
const TILE_SIZE = 0.1;

/**
 * Generate a tile key from bounding box coordinates
 * Uses a grid-based approach for consistent caching
 */
function getTileKey(bbox: BoundingBox): string {
  const minLatTile = Math.floor(bbox.south / TILE_SIZE);
  const maxLatTile = Math.floor(bbox.north / TILE_SIZE);
  const minLonTile = Math.floor(bbox.west / TILE_SIZE);
  const maxLonTile = Math.floor(bbox.east / TILE_SIZE);
  return `${minLatTile}_${maxLatTile}_${minLonTile}_${maxLonTile}`;
}

/**
 * Represents a single tile in the grid
 */
interface Tile {
  south: number;
  north: number;
  west: number;
  east: number;
  key: string;
}

/**
 * Get all tiles that cover a given bounding box
 * Tiles are aligned to TILE_SIZE grid
 */
function getTilesCoveringBbox(bbox: BoundingBox): Tile[] {
  const tiles: Tile[] = [];

  const minLatTile = Math.floor(bbox.south / TILE_SIZE) * TILE_SIZE;
  const maxLatTile = Math.ceil(bbox.north / TILE_SIZE) * TILE_SIZE;
  const minLonTile = Math.floor(bbox.west / TILE_SIZE) * TILE_SIZE;
  const maxLonTile = Math.ceil(bbox.east / TILE_SIZE) * TILE_SIZE;

  for (let lat = minLatTile; lat < maxLatTile; lat += TILE_SIZE) {
    for (let lon = minLonTile; lon < maxLonTile; lon += TILE_SIZE) {
      const tile: Tile = {
        south: lat,
        north: lat + TILE_SIZE,
        west: lon,
        east: lon + TILE_SIZE,
        key: getTileKey({ south: lat, north: lat + TILE_SIZE, west: lon, east: lon + TILE_SIZE })
      };
      tiles.push(tile);
    }
  }

  return tiles;
}

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
  };
}

// Caching queue to serialize write operations and prevent transaction conflicts
let cachingQueue: Promise<void> = Promise.resolve();

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
   */
  async getPOIsInBounds(bbox: BoundingBox): Promise<POI[]> {
    const now = new Date().toISOString();

    const rows = await databaseService.query<POIRow>(
      `SELECT * FROM pois
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

      // Use individual inserts instead of transaction to avoid conflicts
      for (const poi of pois) {
        await db.runAsync(
          `INSERT INTO pois (id, type, category, name, latitude, longitude, tags_json, fetched_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             tags_json = excluded.tags_json,
             fetched_at = excluded.fetched_at,
             expires_at = excluded.expires_at`,
          [
            poi.id,
            poi.type,
            poi.category,
            poi.name,
            poi.latitude,
            poi.longitude,
            JSON.stringify(poi.tags),
            fetchedAt,
            expiresAtStr,
          ]
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

    // Chain to the queue to serialize operations
    cachingQueue = cachingQueue.then(cacheOperation).catch((error) => {
      console.warn('POI caching error (queued):', error);
    });

    return cachingQueue;
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

    // Queue the operation
    cachingQueue = cachingQueue.then(cleanOperation).catch((error) => {
      console.warn('Cache cleanup error:', error);
    });

    return cachingQueue;
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
   */
  async getUncachedTiles(bbox: BoundingBox): Promise<BoundingBox[]> {
    const tiles = getTilesCoveringBbox(bbox);
    const now = new Date().toISOString();
    const uncachedTiles: BoundingBox[] = [];

    for (const tile of tiles) {
      const cached = await databaseService.queryFirst<CacheTileRow>(
        `SELECT * FROM poi_cache_tiles WHERE tile_key = ? AND expires_at > ?`,
        [tile.key, now]
      );

      if (!cached) {
        uncachedTiles.push({
          south: tile.south,
          north: tile.north,
          west: tile.west,
          east: tile.east
        });
      }
    }

    return uncachedTiles;
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
};
