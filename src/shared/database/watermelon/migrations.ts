/**
 * WatermelonDB Migrations
 * Handles schema migrations for backward compatibility
 */
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Future migrations will be added here
    // Example:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({
    //       table: 'pois',
    //       columns: [
    //         { name: 'new_column', type: 'string' },
    //       ],
    //     }),
    //   ],
    // },
  ],
});
