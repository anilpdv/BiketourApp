/**
 * Photo Cache Repository
 * SQLite-based caching for Google Places photo references
 */

import * as SQLite from 'expo-sqlite';
import { logger } from '../../../shared/utils/logger';
import { POIPhoto } from '../types/googlePlaces.types';

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_VERSION = 2; // Bump this to invalidate old cache entries

interface CachedPhotoEntry {
  poi_id: string;
  photos_json: string;
  cached_at: number;
}

interface CacheMetadata {
  key: string;
  value: string;
}

class PhotoCacheRepository {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = this.initialize();
    await this.initPromise;
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('photo_cache.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS photo_cache (
          poi_id TEXT PRIMARY KEY,
          photos_json TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Check cache version and clear if outdated
      await this.checkAndMigrateCacheVersion();

      logger.debug('database', 'Photo cache initialized');
    } catch (error) {
      logger.error('database', 'Failed to initialize photo cache', error);
      throw error;
    }
  }

  private async checkAndMigrateCacheVersion(): Promise<void> {
    try {
      const result = await this.db!.getFirstAsync<CacheMetadata>(
        'SELECT * FROM cache_metadata WHERE key = ?',
        ['version']
      );

      const currentVersion = result ? parseInt(result.value, 10) : 0;

      if (currentVersion < CACHE_VERSION) {
        // Clear old cache entries
        await this.db!.runAsync('DELETE FROM photo_cache');
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)',
          ['version', CACHE_VERSION.toString()]
        );
        logger.debug('cache', `Cache migrated from v${currentVersion} to v${CACHE_VERSION}`);
      }
    } catch (error) {
      logger.warn('cache', 'Failed to check cache version', error);
    }
  }

  async getCachedPhotos(poiId: string): Promise<POIPhoto[] | null> {
    try {
      await this.ensureInitialized();

      const result = await this.db!.getFirstAsync<CachedPhotoEntry>(
        'SELECT * FROM photo_cache WHERE poi_id = ?',
        [poiId]
      );

      if (!result) return null;

      // Check if cache is expired
      if (Date.now() - result.cached_at > CACHE_DURATION_MS) {
        await this.db!.runAsync('DELETE FROM photo_cache WHERE poi_id = ?', [poiId]);
        return null;
      }

      return JSON.parse(result.photos_json);
    } catch (error) {
      logger.warn('cache', 'Failed to get cached photos', error);
      return null;
    }
  }

  async cachePhotos(poiId: string, photos: POIPhoto[]): Promise<void> {
    try {
      await this.ensureInitialized();

      await this.db!.runAsync(
        `INSERT OR REPLACE INTO photo_cache (poi_id, photos_json, cached_at) VALUES (?, ?, ?)`,
        [poiId, JSON.stringify(photos), Date.now()]
      );
    } catch (error) {
      logger.warn('cache', 'Failed to cache photos', error);
    }
  }

  async clearExpired(): Promise<void> {
    try {
      await this.ensureInitialized();
      const expiryTime = Date.now() - CACHE_DURATION_MS;
      await this.db!.runAsync('DELETE FROM photo_cache WHERE cached_at < ?', [expiryTime]);
    } catch (error) {
      logger.warn('cache', 'Failed to clear expired photos', error);
    }
  }

  /**
   * Clear all cached photos
   * Useful when updating the photo fetching logic
   */
  async clearAll(): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.db!.runAsync('DELETE FROM photo_cache');
      logger.debug('cache', 'Photo cache cleared');
    } catch (error) {
      logger.warn('cache', 'Failed to clear photo cache', error);
    }
  }
}

export const photoCacheRepository = new PhotoCacheRepository();
