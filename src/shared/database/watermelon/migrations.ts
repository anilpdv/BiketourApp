/**
 * WatermelonDB Migrations
 * Handles schema migrations for backward compatibility
 */
import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration 1 → 2: Add categories column to poi_cache_tiles
    // This tracks which POI categories have been fetched for each tile
    // Fixes bug where emergency POIs (hospital, pharmacy, police) weren't being fetched
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'poi_cache_tiles',
          columns: [
            { name: 'categories', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    // Migration 2 → 3: Add cached_tile_regions table for offline map tiles
    // Tracks downloaded map tile regions with style, bounds, and zoom levels
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'cached_tile_regions',
          columns: [
            { name: 'region_id', type: 'string', isIndexed: true },
            { name: 'style_key', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'min_lat', type: 'number' },
            { name: 'max_lat', type: 'number' },
            { name: 'min_lon', type: 'number' },
            { name: 'max_lon', type: 'number' },
            { name: 'min_zoom', type: 'number' },
            { name: 'max_zoom', type: 'number' },
            { name: 'tile_count', type: 'number' },
            { name: 'size_bytes', type: 'number' },
            { name: 'downloaded_at', type: 'number' },
          ],
        }),
      ],
    },
    // Migration 3 → 4: Add expenses and trip_plans tables for trip planning
    // Expenses tracks trip spending by category, trip_plans persists trip plans
    {
      toVersion: 4,
      steps: [
        createTable({
          name: 'expenses',
          columns: [
            { name: 'trip_plan_id', type: 'string', isIndexed: true },
            { name: 'day_plan_id', type: 'string', isOptional: true },
            { name: 'date', type: 'string', isIndexed: true },
            { name: 'amount', type: 'number' },
            { name: 'currency', type: 'string' },
            { name: 'category', type: 'string', isIndexed: true },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'country', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'trip_plans',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'euro_velo_id', type: 'number', isOptional: true },
            { name: 'route_id', type: 'string', isOptional: true },
            { name: 'variant', type: 'string', isOptional: true },
            { name: 'start_date', type: 'string' },
            { name: 'end_date', type: 'string', isOptional: true },
            { name: 'daily_distance_km', type: 'number' },
            { name: 'total_distance_km', type: 'number' },
            { name: 'estimated_days', type: 'number' },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'day_plans_json', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
