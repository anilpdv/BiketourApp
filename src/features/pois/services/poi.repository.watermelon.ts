/**
 * POI Repository using WatermelonDB
 * High-performance implementation running SQLite on native thread
 */
import { Q } from '@nozbe/watermelondb';
import {
  database,
  poisCollection,
  favoritesCollection,
  tilesCollection,
  regionsCollection,
} from '../../../shared/database/watermelon/database';
import POIModel from '../../../shared/database/watermelon/models/POI';
import POICacheTileModel from '../../../shared/database/watermelon/models/POICacheTile';
import DownloadedRegionModel from '../../../shared/database/watermelon/models/DownloadedRegion';
import { POI, POICategory, BoundingBox } from '../types';
import { logger } from '../../../shared/utils';

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Downloaded POIs never expire (10 years)
const DOWNLOAD_EXPIRY_MS = 10 * 365 * 24 * 60 * 60 * 1000;

// Grid size for tile keys (in degrees) - approximately 22km at equator
const TILE_SIZE = 0.2;

/**
 * Generate a tile key from bounding box coordinates
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
        key: getTileKey({ south: lat, north: lat + TILE_SIZE, west: lon, east: lon + TILE_SIZE }),
      };
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Convert WatermelonDB POI model to POI type
 */
function modelToPOI(model: POIModel): POI {
  return {
    id: model.poiId,
    type: model.type as 'node' | 'way' | 'relation',
    category: model.category as POICategory,
    name: model.name || null,
    latitude: model.latitude,
    longitude: model.longitude,
    tags: model.tags,
    isDownloaded: model.isDownloaded,
  };
}

/**
 * WatermelonDB POI Repository
 * All operations run on native thread for maximum performance
 */
export const poiRepositoryWM = {
  CACHE_DURATION_MS,

  /**
   * Check if an area (bounding box) is cached and valid
   */
  async isTileCached(bbox: BoundingBox): Promise<boolean> {
    const tileKey = getTileKey(bbox);
    const now = Date.now();

    const tiles = await tilesCollection
      .query(
        Q.and(Q.where('tile_key', tileKey), Q.where('expires_at', Q.gt(now)))
      )
      .fetch();

    return tiles.length > 0;
  },

  /**
   * Get POIs from cache within a bounding box
   */
  async getPOIsInBounds(bbox: BoundingBox): Promise<POI[]> {
    const now = Date.now();

    const pois = await poisCollection
      .query(
        Q.and(
          Q.where('latitude', Q.gte(bbox.south)),
          Q.where('latitude', Q.lte(bbox.north)),
          Q.where('longitude', Q.gte(bbox.west)),
          Q.where('longitude', Q.lte(bbox.east)),
          Q.where('expires_at', Q.gt(now))
        )
      )
      .fetch();

    return pois.map(modelToPOI);
  },

  /**
   * Get POIs by category (optionally within bounds)
   */
  async getPOIsByCategory(category: POICategory, bbox?: BoundingBox): Promise<POI[]> {
    const now = Date.now();

    if (bbox) {
      const pois = await poisCollection
        .query(
          Q.and(
            Q.where('category', category),
            Q.where('latitude', Q.gte(bbox.south)),
            Q.where('latitude', Q.lte(bbox.north)),
            Q.where('longitude', Q.gte(bbox.west)),
            Q.where('longitude', Q.lte(bbox.east)),
            Q.where('expires_at', Q.gt(now))
          )
        )
        .fetch();
      return pois.map(modelToPOI);
    }

    const pois = await poisCollection
      .query(Q.and(Q.where('category', category), Q.where('expires_at', Q.gt(now))))
      .fetch();
    return pois.map(modelToPOI);
  },

  /**
   * Save POIs to cache (batch insert - FAST on native thread!)
   * No write queue needed - WatermelonDB handles concurrency
   */
  async savePOIs(pois: POI[], bbox: BoundingBox): Promise<void> {
    if (pois.length === 0) return;

    const now = Date.now();
    const expiresAt = now + CACHE_DURATION_MS;
    const tileKey = getTileKey(bbox);

    await database.write(async () => {
      // Check for existing POIs to update vs create
      const existingPoiIds = new Set<string>();
      const existingPois = await poisCollection
        .query(Q.where('poi_id', Q.oneOf(pois.map((p) => p.id))))
        .fetch();

      for (const poi of existingPois) {
        existingPoiIds.add(poi.poiId);
      }

      // Prepare batch operations
      const operations: POIModel[] = [];

      for (const poi of pois) {
        if (existingPoiIds.has(poi.id)) {
          // Update existing POI
          const existing = existingPois.find((p) => p.poiId === poi.id);
          if (existing) {
            operations.push(
              existing.prepareUpdate((record) => {
                record.name = poi.name || '';
                record.tagsJson = JSON.stringify(poi.tags || {});
                record.fetchedAt = now;
                record.expiresAt = expiresAt;
              })
            );
          }
        } else {
          // Create new POI
          operations.push(
            poisCollection.prepareCreate((record) => {
              record.poiId = poi.id;
              record.type = poi.type;
              record.category = poi.category;
              record.name = poi.name || '';
              record.latitude = poi.latitude;
              record.longitude = poi.longitude;
              record.tagsJson = JSON.stringify(poi.tags || {});
              record.fetchedAt = now;
              record.expiresAt = expiresAt;
              record.isDownloaded = false;
            })
          );
        }
      }

      // Check if tile exists
      const existingTiles = await tilesCollection
        .query(Q.where('tile_key', tileKey))
        .fetch();

      let tileOperation: POICacheTileModel;
      if (existingTiles.length > 0) {
        tileOperation = existingTiles[0].prepareUpdate((record) => {
          record.fetchedAt = now;
          record.expiresAt = expiresAt;
        });
      } else {
        tileOperation = tilesCollection.prepareCreate((record) => {
          record.tileKey = tileKey;
          record.minLat = bbox.south;
          record.maxLat = bbox.north;
          record.minLon = bbox.west;
          record.maxLon = bbox.east;
          record.fetchedAt = now;
          record.expiresAt = expiresAt;
        });
      }

      // Execute all operations in a single batch
      await database.batch(...operations, tileOperation);
    });

    logger.info('poi', `Saved ${pois.length} POIs to WatermelonDB`);
  },

  /**
   * Save downloaded POIs (permanent - 10 year expiry)
   * FAST batch insert on native thread
   */
  async saveDownloadedPOIs(pois: POI[]): Promise<void> {
    if (pois.length === 0) return;

    const now = Date.now();
    const expiresAt = now + DOWNLOAD_EXPIRY_MS;

    const startTime = Date.now();
    logger.info('poi', `Starting batch save of ${pois.length} downloaded POIs`);

    await database.write(async () => {
      // Check for existing POIs
      const existingPoiIds = new Set<string>();
      const existingPois = await poisCollection
        .query(Q.where('poi_id', Q.oneOf(pois.map((p) => p.id))))
        .fetch();

      for (const poi of existingPois) {
        existingPoiIds.add(poi.poiId);
      }

      const operations: POIModel[] = [];

      for (const poi of pois) {
        if (existingPoiIds.has(poi.id)) {
          // Update existing - mark as downloaded
          const existing = existingPois.find((p) => p.poiId === poi.id);
          if (existing) {
            operations.push(
              existing.prepareUpdate((record) => {
                record.name = poi.name || '';
                record.tagsJson = JSON.stringify(poi.tags || {});
                record.fetchedAt = now;
                record.expiresAt = expiresAt;
                record.isDownloaded = true;
              })
            );
          }
        } else {
          // Create new downloaded POI
          operations.push(
            poisCollection.prepareCreate((record) => {
              record.poiId = poi.id;
              record.type = poi.type;
              record.category = poi.category;
              record.name = poi.name || '';
              record.latitude = poi.latitude;
              record.longitude = poi.longitude;
              record.tagsJson = JSON.stringify(poi.tags || {});
              record.fetchedAt = now;
              record.expiresAt = expiresAt;
              record.isDownloaded = true;
            })
          );
        }
      }

      // Execute all in a single batch - FAST!
      await database.batch(...operations);
    });

    const elapsed = Date.now() - startTime;
    logger.info('poi', `Saved ${pois.length} downloaded POIs in ${elapsed}ms`);
  },

  /**
   * Mark a tile as cached (even if empty)
   */
  async markTileAsCached(bbox: BoundingBox): Promise<void> {
    const now = Date.now();
    const expiresAt = now + CACHE_DURATION_MS;
    const tileKey = getTileKey(bbox);

    await database.write(async () => {
      const existingTiles = await tilesCollection
        .query(Q.where('tile_key', tileKey))
        .fetch();

      if (existingTiles.length > 0) {
        await existingTiles[0].update((record) => {
          record.fetchedAt = now;
          record.expiresAt = expiresAt;
        });
      } else {
        await tilesCollection.create((record) => {
          record.tileKey = tileKey;
          record.minLat = bbox.south;
          record.maxLat = bbox.north;
          record.minLon = bbox.west;
          record.maxLon = bbox.east;
          record.fetchedAt = now;
          record.expiresAt = expiresAt;
        });
      }
    });
  },

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<void> {
    const now = Date.now();

    await database.write(async () => {
      // Delete expired tiles
      const expiredTiles = await tilesCollection
        .query(Q.where('expires_at', Q.lte(now)))
        .fetch();

      // Delete expired POIs that are not favorited or downloaded
      const expiredPois = await poisCollection
        .query(
          Q.and(
            Q.where('expires_at', Q.lte(now)),
            Q.where('is_downloaded', false)
          )
        )
        .fetch();

      // Get favorite IDs to exclude
      const favorites = await favoritesCollection.query().fetch();
      const favoriteIds = new Set(favorites.map((f) => f.poiId));

      const poisToDelete = expiredPois.filter((p) => !favoriteIds.has(p.poiId));

      const deleteOps = [
        ...expiredTiles.map((t) => t.prepareDestroyPermanently()),
        ...poisToDelete.map((p) => p.prepareDestroyPermanently()),
      ];

      if (deleteOps.length > 0) {
        await database.batch(...deleteOps);
        logger.info('poi', `Cleaned ${deleteOps.length} expired entries`);
      }
    });
  },

  // ==================== Viewport-Based Tile Loading ====================

  /**
   * Get all tiles covering a bounding box
   */
  getTilesCoveringBbox(bbox: BoundingBox): BoundingBox[] {
    return getTilesCoveringBbox(bbox).map((tile) => ({
      south: tile.south,
      north: tile.north,
      west: tile.west,
      east: tile.east,
    }));
  },

  /**
   * Get only the tiles that are NOT cached for a bounding box
   */
  async getUncachedTiles(bbox: BoundingBox): Promise<BoundingBox[]> {
    const tiles = getTilesCoveringBbox(bbox);
    if (tiles.length === 0) return [];

    const now = Date.now();
    const tileKeys = tiles.map((t) => t.key);

    // Single batch query
    const cachedTiles = await tilesCollection
      .query(
        Q.and(
          Q.where('tile_key', Q.oneOf(tileKeys)),
          Q.where('expires_at', Q.gt(now))
        )
      )
      .fetch();

    const cachedKeys = new Set(cachedTiles.map((t) => t.tileKey));

    return tiles
      .filter((t) => !cachedKeys.has(t.key))
      .map((t) => ({
        south: t.south,
        north: t.north,
        west: t.west,
        east: t.east,
      }));
  },

  /**
   * Check which tiles are cached
   */
  async getCachedTileKeys(bbox: BoundingBox): Promise<Set<string>> {
    const tiles = getTilesCoveringBbox(bbox);
    const now = Date.now();

    if (tiles.length === 0) return new Set();

    const tileKeys = tiles.map((t) => t.key);

    const cachedTiles = await tilesCollection
      .query(
        Q.and(
          Q.where('tile_key', Q.oneOf(tileKeys)),
          Q.where('expires_at', Q.gt(now))
        )
      )
      .fetch();

    return new Set(cachedTiles.map((t) => t.tileKey));
  },

  // ==================== Favorites Operations ====================

  /**
   * Add a POI to favorites
   */
  async addFavorite(poiId: string, note?: string): Promise<void> {
    const now = Date.now();
    const farFuture = now + DOWNLOAD_EXPIRY_MS;

    await database.write(async () => {
      // Check if already favorited
      const existing = await favoritesCollection
        .query(Q.where('poi_id', poiId))
        .fetch();

      if (existing.length > 0) {
        await existing[0].update((record) => {
          record.userNote = note || '';
        });
      } else {
        await favoritesCollection.create((record) => {
          record.poiId = poiId;
          record.userNote = note || '';
          record.favoritedAt = now;
        });
      }

      // Extend POI expiry
      const poi = await poisCollection.query(Q.where('poi_id', poiId)).fetch();
      if (poi.length > 0) {
        await poi[0].update((record) => {
          record.expiresAt = farFuture;
        });
      }
    });
  },

  /**
   * Remove a POI from favorites
   */
  async removeFavorite(poiId: string): Promise<void> {
    await database.write(async () => {
      const favorites = await favoritesCollection
        .query(Q.where('poi_id', poiId))
        .fetch();

      for (const fav of favorites) {
        await fav.destroyPermanently();
      }
    });
  },

  /**
   * Get all favorited POIs
   */
  async getFavorites(): Promise<POI[]> {
    const favorites = await favoritesCollection.query().fetch();
    const poiIds = favorites.map((f) => f.poiId);

    if (poiIds.length === 0) return [];

    const pois = await poisCollection
      .query(Q.where('poi_id', Q.oneOf(poiIds)))
      .fetch();

    return pois.map(modelToPOI);
  },

  /**
   * Check if a POI is favorited
   */
  async isFavorite(poiId: string): Promise<boolean> {
    const favorites = await favoritesCollection
      .query(Q.where('poi_id', poiId))
      .fetch();
    return favorites.length > 0;
  },

  /**
   * Get favorite statuses for multiple POIs
   */
  async getFavoriteStatuses(poiIds: string[]): Promise<Set<string>> {
    if (poiIds.length === 0) return new Set();

    const favorites = await favoritesCollection
      .query(Q.where('poi_id', Q.oneOf(poiIds)))
      .fetch();

    return new Set(favorites.map((f) => f.poiId));
  },

  /**
   * Update the note for a favorited POI
   */
  async updateFavoriteNote(poiId: string, note: string): Promise<void> {
    await database.write(async () => {
      const favorites = await favoritesCollection
        .query(Q.where('poi_id', poiId))
        .fetch();

      if (favorites.length > 0) {
        await favorites[0].update((record) => {
          record.userNote = note;
        });
      }
    });
  },

  /**
   * Get the note for a favorited POI
   */
  async getFavoriteNote(poiId: string): Promise<string | null> {
    const favorites = await favoritesCollection
      .query(Q.where('poi_id', poiId))
      .fetch();

    return favorites.length > 0 ? favorites[0].userNote || null : null;
  },

  // ==================== Downloaded POI Operations ====================

  /**
   * Get downloaded (permanent) POIs within bounds
   */
  async getDownloadedPOIsInBounds(bbox: BoundingBox): Promise<POI[]> {
    const pois = await poisCollection
      .query(
        Q.and(
          Q.where('is_downloaded', true),
          Q.where('latitude', Q.gte(bbox.south)),
          Q.where('latitude', Q.lte(bbox.north)),
          Q.where('longitude', Q.gte(bbox.west)),
          Q.where('longitude', Q.lte(bbox.east))
        )
      )
      .fetch();

    return pois.map(modelToPOI);
  },

  /**
   * Check if area has any downloaded POIs
   */
  async hasDownloadedPOIsInBounds(bbox: BoundingBox): Promise<boolean> {
    const count = await poisCollection
      .query(
        Q.and(
          Q.where('is_downloaded', true),
          Q.where('latitude', Q.gte(bbox.south)),
          Q.where('latitude', Q.lte(bbox.north)),
          Q.where('longitude', Q.gte(bbox.west)),
          Q.where('longitude', Q.lte(bbox.east))
        )
      )
      .fetchCount();

    return count > 0;
  },

  /**
   * Get POIs in bounds with preference for downloaded
   */
  async getPOIsInBoundsWithDownloadPriority(bbox: BoundingBox): Promise<POI[]> {
    const now = Date.now();

    const pois = await poisCollection
      .query(
        Q.and(
          Q.where('latitude', Q.gte(bbox.south)),
          Q.where('latitude', Q.lte(bbox.north)),
          Q.where('longitude', Q.gte(bbox.west)),
          Q.where('longitude', Q.lte(bbox.east)),
          Q.or(Q.where('is_downloaded', true), Q.where('expires_at', Q.gt(now)))
        )
      )
      .fetch();

    // Deduplicate by ID, preferring downloaded
    const poiMap = new Map<string, POI>();
    for (const poi of pois) {
      if (!poiMap.has(poi.poiId) || poi.isDownloaded) {
        poiMap.set(poi.poiId, modelToPOI(poi));
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
    const pois = await poisCollection
      .query(
        Q.and(
          Q.where('is_downloaded', true),
          Q.where('latitude', Q.gte(bbox.south)),
          Q.where('latitude', Q.lte(bbox.north)),
          Q.where('longitude', Q.gte(bbox.west)),
          Q.where('longitude', Q.lte(bbox.east))
        )
      )
      .fetch();

    const counts: Record<string, number> = {};
    for (const poi of pois) {
      counts[poi.category] = (counts[poi.category] || 0) + 1;
    }

    return counts as Record<POICategory, number>;
  },

  // ==================== Downloaded Region Operations ====================

  /**
   * Save a downloaded region record
   */
  async saveDownloadedRegion(region: {
    id: string;
    name: string;
    centerLat: number;
    centerLon: number;
    radiusKm: number;
    bbox: BoundingBox;
    poiCount: number;
    sizeBytes: number;
    categories: string[];
  }): Promise<void> {
    const now = Date.now();

    await database.write(async () => {
      // Check if region exists
      const existing = await regionsCollection
        .query(Q.where('region_id', region.id))
        .fetch();

      if (existing.length > 0) {
        await existing[0].update((record) => {
          record.name = region.name;
          record.poiCount = region.poiCount;
          record.sizeBytes = region.sizeBytes;
          record.downloadedAt = now;
          record.categoriesJson = JSON.stringify(region.categories);
        });
      } else {
        await regionsCollection.create((record) => {
          record.regionId = region.id;
          record.name = region.name;
          record.centerLat = region.centerLat;
          record.centerLon = region.centerLon;
          record.radiusKm = region.radiusKm;
          record.minLat = region.bbox.south;
          record.maxLat = region.bbox.north;
          record.minLon = region.bbox.west;
          record.maxLon = region.bbox.east;
          record.poiCount = region.poiCount;
          record.sizeBytes = region.sizeBytes;
          record.downloadedAt = now;
          record.categoriesJson = JSON.stringify(region.categories);
        });
      }
    });
  },

  /**
   * Get all downloaded regions
   */
  async getDownloadedRegions(): Promise<DownloadedRegionModel[]> {
    return regionsCollection.query().fetch();
  },

  /**
   * Delete a downloaded region and its POIs
   */
  async deleteDownloadedRegion(regionId: string): Promise<void> {
    await database.write(async () => {
      // Get region details
      const regions = await regionsCollection
        .query(Q.where('region_id', regionId))
        .fetch();

      if (regions.length === 0) return;

      const region = regions[0];

      // Delete POIs in this region
      const poisInRegion = await poisCollection
        .query(
          Q.and(
            Q.where('is_downloaded', true),
            Q.where('latitude', Q.gte(region.minLat)),
            Q.where('latitude', Q.lte(region.maxLat)),
            Q.where('longitude', Q.gte(region.minLon)),
            Q.where('longitude', Q.lte(region.maxLon))
          )
        )
        .fetch();

      const deleteOps = [
        region.prepareDestroyPermanently(),
        ...poisInRegion.map((p) => p.prepareDestroyPermanently()),
      ];

      await database.batch(...deleteOps);

      logger.info(
        'poi',
        `Deleted region ${regionId} with ${poisInRegion.length} POIs`
      );
    });
  },
};
