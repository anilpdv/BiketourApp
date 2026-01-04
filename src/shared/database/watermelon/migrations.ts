/**
 * WatermelonDB Migrations
 * Handles schema migrations for backward compatibility
 */
import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});
