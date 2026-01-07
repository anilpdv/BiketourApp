/**
 * WatermelonDB Schema
 * Defines the database structure for POI-related tables
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3,
  tables: [
    // POIs table - stores all points of interest
    tableSchema({
      name: 'pois',
      columns: [
        { name: 'poi_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isIndexed: true },
        { name: 'longitude', type: 'number', isIndexed: true },
        { name: 'tags_json', type: 'string' },
        { name: 'fetched_at', type: 'number' },
        { name: 'expires_at', type: 'number' },
        { name: 'is_downloaded', type: 'boolean', isIndexed: true },
      ],
    }),

    // POI Favorites - user-saved favorites
    tableSchema({
      name: 'poi_favorites',
      columns: [
        { name: 'poi_id', type: 'string', isIndexed: true },
        { name: 'user_note', type: 'string', isOptional: true },
        { name: 'favorited_at', type: 'number' },
      ],
    }),

    // POI Cache Tiles - tracks which areas have been fetched
    tableSchema({
      name: 'poi_cache_tiles',
      columns: [
        { name: 'tile_key', type: 'string', isIndexed: true },
        { name: 'min_lat', type: 'number' },
        { name: 'max_lat', type: 'number' },
        { name: 'min_lon', type: 'number' },
        { name: 'max_lon', type: 'number' },
        { name: 'fetched_at', type: 'number' },
        { name: 'expires_at', type: 'number' },
        { name: 'categories', type: 'string', isOptional: true },  // Comma-separated fetched categories
      ],
    }),

    // Downloaded Regions - tracks offline download areas
    tableSchema({
      name: 'poi_downloaded_regions',
      columns: [
        { name: 'region_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'center_lat', type: 'number' },
        { name: 'center_lon', type: 'number' },
        { name: 'radius_km', type: 'number' },
        { name: 'min_lat', type: 'number' },
        { name: 'max_lat', type: 'number' },
        { name: 'min_lon', type: 'number' },
        { name: 'max_lon', type: 'number' },
        { name: 'poi_count', type: 'number' },
        { name: 'size_bytes', type: 'number' },
        { name: 'downloaded_at', type: 'number' },
        { name: 'categories_json', type: 'string' },
      ],
    }),

    // Cached Tile Regions - tracks offline map tile downloads
    tableSchema({
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
});
