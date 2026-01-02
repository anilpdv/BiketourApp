import { databaseService } from '../../../shared/database/database.service';
import { WeatherForecast, CurrentWeather, DailyForecast } from '../types';
import { logger, getCoordinateCacheKey, createWriteQueue } from '../../../shared/utils';

interface WeatherCacheRow {
  cache_key: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current_json: string;
  daily_json: string;
  fetched_at: string;
  expires_at: string;
}

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Write queue to serialize database operations and prevent transaction conflicts
const writeQueue = createWriteQueue();

/**
 * Convert database row to WeatherForecast object
 */
function rowToWeatherForecast(row: WeatherCacheRow): WeatherForecast {
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    fetchedAt: new Date(row.fetched_at),
    current: JSON.parse(row.current_json) as CurrentWeather,
    daily: JSON.parse(row.daily_json) as DailyForecast[],
  };
}

/**
 * Weather repository for SQLite cache operations
 */
export const weatherRepository = {
  CACHE_DURATION_MS,

  /**
   * Get cached weather for a location
   * Returns null if not cached or expired
   */
  async getCached(lat: number, lon: number): Promise<WeatherForecast | null> {
    const cacheKey = getCoordinateCacheKey(lat, lon);
    const now = new Date().toISOString();

    const row = await databaseService.queryFirst<WeatherCacheRow>(
      `SELECT * FROM weather_cache WHERE cache_key = ? AND expires_at > ?`,
      [cacheKey, now]
    );

    if (!row) {
      return null;
    }

    return rowToWeatherForecast(row);
  },

  /**
   * Cache weather forecast
   * Uses write queue to prevent transaction conflicts
   */
  async cache(weather: WeatherForecast): Promise<void> {
    const cacheOperation = async (): Promise<void> => {
      const cacheKey = getCoordinateCacheKey(weather.latitude, weather.longitude);
      const now = new Date(weather.fetchedAt);
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
      const fetchedAtStr = now.toISOString();
      const expiresAtStr = expiresAt.toISOString();

      await databaseService.execute(
        `INSERT INTO weather_cache (cache_key, latitude, longitude, timezone, current_json, daily_json, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           timezone = excluded.timezone,
           current_json = excluded.current_json,
           daily_json = excluded.daily_json,
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
        [
          cacheKey,
          weather.latitude,
          weather.longitude,
          weather.timezone,
          JSON.stringify(weather.current),
          JSON.stringify(weather.daily),
          fetchedAtStr,
          expiresAtStr,
        ]
      );
    };

    // Queue the write operation
    return writeQueue.enqueue(cacheOperation, (error) => {
      logger.warn('cache', 'Weather cache write error', error);
    });
  },

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    const now = new Date().toISOString();
    const result = await databaseService.execute(
      `DELETE FROM weather_cache WHERE expires_at <= ?`,
      [now]
    );
    return result.changes;
  },

  /**
   * Clear all weather cache
   */
  async clearAll(): Promise<void> {
    await databaseService.execute(`DELETE FROM weather_cache`);
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ total: number; expired: number }> {
    const now = new Date().toISOString();

    const totalRow = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM weather_cache`
    );

    const expiredRow = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM weather_cache WHERE expires_at <= ?`,
      [now]
    );

    return {
      total: totalRow?.count ?? 0,
      expired: expiredRow?.count ?? 0,
    };
  },
};
