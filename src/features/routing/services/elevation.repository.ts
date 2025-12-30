import { databaseService } from '../../../shared/database/database.service';
import { logger } from '../../../shared/utils';

interface ElevationCacheRow {
  cache_key: string;
  latitude: number;
  longitude: number;
  elevation: number;
  fetched_at: string;
  expires_at: string;
}

// Cache duration: 30 days (elevation data is static)
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate cache key from coordinates
 * Uses 2 decimal precision (~1km)
 */
function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

// Write queue to serialize database operations and prevent transaction conflicts
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Elevation repository for SQLite cache operations
 */
export const elevationRepository = {
  CACHE_DURATION_MS,

  /**
   * Get cached elevation for a single point
   * Returns null if not cached or expired
   */
  async getCached(lat: number, lon: number): Promise<number | null> {
    const cacheKey = getCacheKey(lat, lon);
    const now = new Date().toISOString();

    const row = await databaseService.queryFirst<ElevationCacheRow>(
      `SELECT * FROM elevation_cache WHERE cache_key = ? AND expires_at > ?`,
      [cacheKey, now]
    );

    if (!row) {
      return null;
    }

    return row.elevation;
  },

  /**
   * Get cached elevations for multiple coordinates
   * Returns a map of cache_key -> elevation for found entries
   */
  async getCachedBatch(
    coordinates: { latitude: number; longitude: number }[]
  ): Promise<Map<string, number>> {
    if (coordinates.length === 0) {
      return new Map();
    }

    const cacheKeys = coordinates.map((c) => getCacheKey(c.latitude, c.longitude));
    const uniqueKeys = [...new Set(cacheKeys)];
    const now = new Date().toISOString();

    // Query in batches to avoid SQL parameter limits
    const BATCH_SIZE = 100;
    const result = new Map<string, number>();

    for (let i = 0; i < uniqueKeys.length; i += BATCH_SIZE) {
      const batchKeys = uniqueKeys.slice(i, i + BATCH_SIZE);
      const placeholders = batchKeys.map(() => '?').join(',');

      const rows = await databaseService.query<ElevationCacheRow>(
        `SELECT * FROM elevation_cache WHERE cache_key IN (${placeholders}) AND expires_at > ?`,
        [...batchKeys, now]
      );

      for (const row of rows) {
        result.set(row.cache_key, row.elevation);
      }
    }

    return result;
  },

  /**
   * Cache a single elevation point
   * Uses write queue to prevent transaction conflicts
   */
  async cache(lat: number, lon: number, elevation: number): Promise<void> {
    const cacheOperation = async (): Promise<void> => {
      const cacheKey = getCacheKey(lat, lon);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      const fetchedAtStr = now.toISOString();
      const expiresAtStr = expiresAt.toISOString();

      await databaseService.execute(
        `INSERT INTO elevation_cache (cache_key, latitude, longitude, elevation, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           elevation = excluded.elevation,
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
        [cacheKey, lat, lon, elevation, fetchedAtStr, expiresAtStr]
      );
    };

    // Queue the write operation
    writeQueue = writeQueue.then(cacheOperation).catch((error) => {
      logger.warn('cache', 'Elevation cache write error', error);
    });

    return writeQueue;
  },

  /**
   * Cache multiple elevation points in batch
   * Uses write queue to prevent transaction conflicts
   */
  async cacheBatch(
    data: { latitude: number; longitude: number; elevation: number }[]
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const cacheOperation = async (): Promise<void> => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      const fetchedAtStr = now.toISOString();
      const expiresAtStr = expiresAt.toISOString();

      // Insert in batches using transaction
      await databaseService.transaction(async (db) => {
        for (const item of data) {
          const cacheKey = getCacheKey(item.latitude, item.longitude);

          await db.runAsync(
            `INSERT INTO elevation_cache (cache_key, latitude, longitude, elevation, fetched_at, expires_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(cache_key) DO UPDATE SET
               latitude = excluded.latitude,
               longitude = excluded.longitude,
               elevation = excluded.elevation,
               fetched_at = excluded.fetched_at,
               expires_at = excluded.expires_at`,
            [cacheKey, item.latitude, item.longitude, item.elevation, fetchedAtStr, expiresAtStr]
          );
        }
      });
    };

    // Queue the write operation
    writeQueue = writeQueue.then(cacheOperation).catch((error) => {
      logger.warn('cache', 'Elevation cache batch write error', error);
    });

    return writeQueue;
  },

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    const now = new Date().toISOString();
    const result = await databaseService.execute(
      `DELETE FROM elevation_cache WHERE expires_at <= ?`,
      [now]
    );
    return result.changes;
  },

  /**
   * Clear all elevation cache
   */
  async clearAll(): Promise<void> {
    await databaseService.execute(`DELETE FROM elevation_cache`);
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ total: number; expired: number }> {
    const now = new Date().toISOString();

    const totalRow = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM elevation_cache`
    );

    const expiredRow = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM elevation_cache WHERE expires_at <= ?`,
      [now]
    );

    return {
      total: totalRow?.count ?? 0,
      expired: expiredRow?.count ?? 0,
    };
  },

  /**
   * Get cache key for a coordinate (exposed for external use)
   */
  getCacheKey,
};
