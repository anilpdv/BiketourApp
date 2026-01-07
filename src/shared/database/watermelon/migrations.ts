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
  ],
});
