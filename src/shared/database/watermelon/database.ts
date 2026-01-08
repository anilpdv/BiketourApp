/**
 * WatermelonDB Database Initialization
 * Creates and exports the database instance with all model classes
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { migrations } from './migrations';
import {
  POIModel,
  POIFavoriteModel,
  POICacheTileModel,
  DownloadedRegionModel,
  CachedTileRegionModel,
  ExpenseModel,
  TripPlanModel,
} from './models';

// Create the SQLite adapter with JSI for better performance
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'biketoureurope_wm',
  jsi: true, // Use JSI for native thread execution
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

// Create the database instance
export const database = new Database({
  adapter,
  modelClasses: [
    POIModel,
    POIFavoriteModel,
    POICacheTileModel,
    DownloadedRegionModel,
    CachedTileRegionModel,
    ExpenseModel,
    TripPlanModel,
  ],
});

// Export typed collection helpers
export const poisCollection = database.get<POIModel>('pois');
export const favoritesCollection = database.get<POIFavoriteModel>('poi_favorites');
export const tilesCollection = database.get<POICacheTileModel>('poi_cache_tiles');
export const regionsCollection = database.get<DownloadedRegionModel>('poi_downloaded_regions');
export const cachedTileRegionsCollection = database.get<CachedTileRegionModel>('cached_tile_regions');
export const expensesCollection = database.get<ExpenseModel>('expenses');
export const tripPlansCollection = database.get<TripPlanModel>('trip_plans');
