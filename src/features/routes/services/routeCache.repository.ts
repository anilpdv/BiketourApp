import { databaseService } from '../../../shared/database/database.service';
import { ParsedRoute, RoutePoint, RouteVariant } from '../types';
import { logger, createWriteQueue } from '../../../shared/utils';

// Caching queue to serialize write operations and prevent transaction conflicts
const cachingQueue = createWriteQueue();

interface CachedRouteRow {
  route_id: string;
  variant: string;
  name: string;
  total_distance: number;
  elevation_gain: number | null;
  elevation_loss: number | null;
  bounds_json: string;
  parsed_at: string;
  gpx_hash: string;
}

interface CachedSegmentRow {
  id: number;
  route_id: string;
  segment_index: number;
  points_json: string;
}

/**
 * Simple hash function for GPX content
 * Used to detect if the GPX file has changed
 */
export function computeGPXHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Route cache repository for storing and retrieving parsed EuroVelo routes
 */
export const routeCacheRepository = {
  /**
   * Check if a route is cached with a matching hash
   */
  async isCached(routeId: string, gpxHash: string): Promise<boolean> {
    const row = await databaseService.queryFirst<CachedRouteRow>(
      `SELECT gpx_hash FROM eurovelo_cache_routes WHERE route_id = ?`,
      [routeId]
    );
    return row !== null && row.gpx_hash === gpxHash;
  },

  /**
   * Get a cached route by ID
   */
  async getCachedRoute(routeId: string): Promise<ParsedRoute | null> {
    // Get route metadata
    const routeRow = await databaseService.queryFirst<CachedRouteRow>(
      `SELECT * FROM eurovelo_cache_routes WHERE route_id = ?`,
      [routeId]
    );

    if (!routeRow) {
      return null;
    }

    // Get route segments
    const segmentRows = await databaseService.query<CachedSegmentRow>(
      `SELECT * FROM eurovelo_cache_segments
       WHERE route_id = ?
       ORDER BY segment_index ASC`,
      [routeId]
    );

    // Parse segments
    const segments: RoutePoint[][] = segmentRows.map(row =>
      JSON.parse(row.points_json) as RoutePoint[]
    );

    // Flatten segments to get all points
    const points: RoutePoint[] = segments.flat();

    // Parse bounds
    const bounds = JSON.parse(routeRow.bounds_json);

    // Extract euroVeloId from routeId (e.g., "ev6-full" -> 6)
    const euroVeloIdMatch = routeId.match(/ev(\d+)/);
    const euroVeloId = euroVeloIdMatch ? parseInt(euroVeloIdMatch[1], 10) : 0;

    return {
      id: routeRow.route_id,
      euroVeloId,
      variant: routeRow.variant as RouteVariant,
      name: routeRow.name,
      points,
      segments,
      totalDistance: routeRow.total_distance,
      elevationGain: routeRow.elevation_gain ?? undefined,
      elevationLoss: routeRow.elevation_loss ?? undefined,
      color: '', // Color is determined by routeLoader, not cached
      bounds,
    };
  },

  /**
   * Cache a parsed route
   * Uses a queue to serialize writes and prevent transaction conflicts
   */
  async cacheRoute(route: ParsedRoute, gpxHash: string): Promise<void> {
    const cacheOperation = async (): Promise<void> => {
      const now = new Date().toISOString();
      const boundsJson = JSON.stringify(route.bounds);
      const db = await databaseService.getDatabase();

      // Insert or update route metadata
      await db.runAsync(
        `INSERT INTO eurovelo_cache_routes
         (route_id, variant, name, total_distance, elevation_gain, elevation_loss, bounds_json, parsed_at, gpx_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(route_id) DO UPDATE SET
           variant = excluded.variant,
           name = excluded.name,
           total_distance = excluded.total_distance,
           elevation_gain = excluded.elevation_gain,
           elevation_loss = excluded.elevation_loss,
           bounds_json = excluded.bounds_json,
           parsed_at = excluded.parsed_at,
           gpx_hash = excluded.gpx_hash`,
        [
          route.id,
          route.variant,
          route.name,
          route.totalDistance,
          route.elevationGain ?? null,
          route.elevationLoss ?? null,
          boundsJson,
          now,
          gpxHash,
        ]
      );

      // Delete existing segments for this route
      await db.runAsync(
        `DELETE FROM eurovelo_cache_segments WHERE route_id = ?`,
        [route.id]
      );

      // Insert new segments
      for (let i = 0; i < route.segments.length; i++) {
        const segment = route.segments[i];
        const pointsJson = JSON.stringify(segment);

        await db.runAsync(
          `INSERT INTO eurovelo_cache_segments (route_id, segment_index, points_json)
           VALUES (?, ?, ?)`,
          [route.id, i, pointsJson]
        );
      }
    };

    // Chain to the queue to serialize operations
    return cachingQueue.enqueue(cacheOperation, (error) => {
      logger.warn('cache', 'Route caching error (queued)', error);
    });
  },

  /**
   * Invalidate cache for a specific route
   * Uses queue to prevent transaction conflicts
   */
  async invalidateCache(routeId: string): Promise<void> {
    const invalidateOperation = async (): Promise<void> => {
      const db = await databaseService.getDatabase();
      await db.runAsync(
        `DELETE FROM eurovelo_cache_segments WHERE route_id = ?`,
        [routeId]
      );
      await db.runAsync(
        `DELETE FROM eurovelo_cache_routes WHERE route_id = ?`,
        [routeId]
      );
    };

    return cachingQueue.enqueue(invalidateOperation, (error) => {
      logger.warn('cache', 'Route cache invalidation error', error);
    });
  },

  /**
   * Clear all cached routes
   * Uses queue to prevent transaction conflicts
   */
  async clearAllCache(): Promise<void> {
    const clearOperation = async (): Promise<void> => {
      const db = await databaseService.getDatabase();
      await db.runAsync(`DELETE FROM eurovelo_cache_segments`);
      await db.runAsync(`DELETE FROM eurovelo_cache_routes`);
    };

    return cachingQueue.enqueue(clearOperation, (error) => {
      logger.warn('cache', 'Route cache clear error', error);
    });
  },

  /**
   * Get all cached route IDs
   */
  async getCachedRouteIds(): Promise<string[]> {
    const rows = await databaseService.query<{ route_id: string }>(
      `SELECT route_id FROM eurovelo_cache_routes`
    );
    return rows.map(r => r.route_id);
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    routeCount: number;
    segmentCount: number;
    oldestCacheDate: string | null;
  }> {
    const routeCount = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM eurovelo_cache_routes`
    );
    const segmentCount = await databaseService.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM eurovelo_cache_segments`
    );
    const oldest = await databaseService.queryFirst<{ parsed_at: string }>(
      `SELECT parsed_at FROM eurovelo_cache_routes ORDER BY parsed_at ASC LIMIT 1`
    );

    return {
      routeCount: routeCount?.count ?? 0,
      segmentCount: segmentCount?.count ?? 0,
      oldestCacheDate: oldest?.parsed_at ?? null,
    };
  },
};
