// Database name
export const DB_NAME = 'biketoureurope.db';

// Schema version for migrations
export const SCHEMA_VERSION = 3;

// SQL statements for creating tables
export const CREATE_TABLES = {
  // Custom routes table
  customRoutes: `
    CREATE TABLE IF NOT EXISTS custom_routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      mode TEXT NOT NULL,
      distance REAL NOT NULL,
      duration REAL,
      elevation_gain REAL,
      elevation_loss REAL,
      base_route_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  // Route waypoints table
  routeWaypoints: `
    CREATE TABLE IF NOT EXISTS route_waypoints (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (route_id) REFERENCES custom_routes(id) ON DELETE CASCADE
    )
  `,

  // Route geometry (stored as compressed JSON)
  routeGeometry: `
    CREATE TABLE IF NOT EXISTS route_geometry (
      route_id TEXT PRIMARY KEY,
      geometry_json TEXT NOT NULL,
      FOREIGN KEY (route_id) REFERENCES custom_routes(id) ON DELETE CASCADE
    )
  `,

  // Search history
  searchHistory: `
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      result_type TEXT NOT NULL,
      result_id TEXT,
      result_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      searched_at TEXT NOT NULL
    )
  `,

  // Schema version table
  schemaVersion: `
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    )
  `,

  // POI cache table
  pois: `
    CREATE TABLE IF NOT EXISTS pois (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      tags_json TEXT,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `,

  // POI favorites table
  poiFavorites: `
    CREATE TABLE IF NOT EXISTS poi_favorites (
      poi_id TEXT PRIMARY KEY,
      user_note TEXT,
      favorited_at TEXT NOT NULL,
      FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
    )
  `,

  // Cache tile tracking (which geographic areas have been cached)
  poiCacheTiles: `
    CREATE TABLE IF NOT EXISTS poi_cache_tiles (
      tile_key TEXT PRIMARY KEY,
      min_lat REAL NOT NULL,
      max_lat REAL NOT NULL,
      min_lon REAL NOT NULL,
      max_lon REAL NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `,

  // EuroVelo route cache - stores parsed route metadata
  euroveloCacheRoutes: `
    CREATE TABLE IF NOT EXISTS eurovelo_cache_routes (
      route_id TEXT PRIMARY KEY,
      variant TEXT NOT NULL,
      name TEXT NOT NULL,
      total_distance REAL NOT NULL,
      elevation_gain REAL,
      elevation_loss REAL,
      bounds_json TEXT NOT NULL,
      parsed_at TEXT NOT NULL,
      gpx_hash TEXT NOT NULL
    )
  `,

  // EuroVelo route segments - stores route point data
  euroveloCacheSegments: `
    CREATE TABLE IF NOT EXISTS eurovelo_cache_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id TEXT NOT NULL,
      segment_index INTEGER NOT NULL,
      points_json TEXT NOT NULL,
      FOREIGN KEY (route_id) REFERENCES eurovelo_cache_routes(route_id) ON DELETE CASCADE
    )
  `,
};

// Indexes for better performance
export const CREATE_INDEXES = {
  routeWaypointsRouteId: `
    CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id
    ON route_waypoints(route_id)
  `,
  routeWaypointsOrder: `
    CREATE INDEX IF NOT EXISTS idx_route_waypoints_order
    ON route_waypoints(route_id, order_index)
  `,
  searchHistoryDate: `
    CREATE INDEX IF NOT EXISTS idx_search_history_date
    ON search_history(searched_at DESC)
  `,
  customRoutesDate: `
    CREATE INDEX IF NOT EXISTS idx_custom_routes_date
    ON custom_routes(updated_at DESC)
  `,

  // POI indexes
  poisCategory: `
    CREATE INDEX IF NOT EXISTS idx_pois_category
    ON pois(category)
  `,
  poisLocation: `
    CREATE INDEX IF NOT EXISTS idx_pois_location
    ON pois(latitude, longitude)
  `,
  poisExpiry: `
    CREATE INDEX IF NOT EXISTS idx_pois_expires
    ON pois(expires_at)
  `,
  poiFavoritesDate: `
    CREATE INDEX IF NOT EXISTS idx_poi_favorites_date
    ON poi_favorites(favorited_at DESC)
  `,

  // EuroVelo cache indexes
  euroveloCacheRouteId: `
    CREATE INDEX IF NOT EXISTS idx_eurovelo_cache_route_id
    ON eurovelo_cache_segments(route_id)
  `,
  euroveloCacheSegmentOrder: `
    CREATE INDEX IF NOT EXISTS idx_eurovelo_cache_segment_order
    ON eurovelo_cache_segments(route_id, segment_index)
  `,
};

// All tables in order of creation
export const ALL_TABLES = [
  CREATE_TABLES.schemaVersion,
  CREATE_TABLES.customRoutes,
  CREATE_TABLES.routeWaypoints,
  CREATE_TABLES.routeGeometry,
  CREATE_TABLES.searchHistory,
  CREATE_TABLES.pois,
  CREATE_TABLES.poiFavorites,
  CREATE_TABLES.poiCacheTiles,
  CREATE_TABLES.euroveloCacheRoutes,
  CREATE_TABLES.euroveloCacheSegments,
];

// All indexes
export const ALL_INDEXES = Object.values(CREATE_INDEXES);
