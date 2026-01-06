// Route variant type
export type RouteVariant = 'full' | 'developed';

// Route coordinate point
export interface RoutePoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  distanceFromStart?: number; // in km
}

// EuroVelo route definition
export interface EuroVeloRoute {
  id: string;              // "ev1", "ev6", etc.
  euroVeloId: number;      // 1, 6, 15, etc.
  name: string;
  description: string;
  fullDescription?: string; // Detailed description from eurovelo.com
  distance: number;        // in km
  distanceUnit?: string;   // "km" (optional for backwards compatibility)
  countries: string[];
  countryCount?: number;   // Number of countries
  color: string;           // hex color for map display
  difficulty: 'easy' | 'moderate' | 'difficult';
  surface: string[];
  highlights: string[];
  keyCities?: string[];    // Major cities along the route
  unescoSites?: number;    // Number of UNESCO World Heritage sites
  imageUrl?: string;       // Hero image URL from eurovelo.com
  websiteUrl?: string;     // Official EuroVelo page URL
  gpxFile?: string;        // Path to GPX file
  bestSeason: string[];
  stages?: Array<{ name: string; region: string }>;
  terrainDescription?: string;
  practicalInfo?: string;
  enabled: boolean;
}

// Parsed route with coordinates
export interface ParsedRoute {
  id: string;
  euroVeloId: number;
  variant: RouteVariant;
  name: string;
  points: RoutePoint[];
  segments: RoutePoint[][];  // Separate segments for proper rendering (avoids straight lines across gaps)
  totalDistance: number;   // in km
  elevationGain?: number;  // in meters
  elevationLoss?: number;  // in meters
  color: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

// Route segment for displaying on map
export interface RouteSegment {
  routeId: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  color: string;
}

// GPX track structure
export interface GPXTrack {
  name?: string;
  segments: GPXTrackSegment[];
}

export interface GPXTrackSegment {
  points: GPXTrackPoint[];
}

export interface GPXTrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

// GPX file structure
export interface GPXData {
  metadata?: {
    name?: string;
    desc?: string;
    time?: string;
  };
  tracks: GPXTrack[];
}

// Surface type for route segments
export type SurfaceType = 'paved' | 'gravel' | 'unpaved' | 'unknown';

// Surface segment with coordinates
export interface SurfaceSegment {
  surface: SurfaceType;
  coordinates: [number, number][]; // [lon, lat] pairs for GeoJSON
  startIndex: number;
  endIndex: number;
}

// Surface data for a route
export interface RouteSurfaceData {
  routeId: string;
  segments: SurfaceSegment[];
  summary: {
    paved: number;    // percentage
    gravel: number;
    unpaved: number;
    unknown: number;
  };
}

// Surface colors for map display
export const SURFACE_COLORS: Record<SurfaceType, string> = {
  paved: '#4CAF50',    // Green - smooth riding
  gravel: '#FF9800',   // Orange - caution
  unpaved: '#795548',  // Brown - rough
  unknown: '#9E9E9E',  // Gray - no data
};

// OSM surface tag to SurfaceType mapping
export const SURFACE_TAG_MAP: Record<string, SurfaceType> = {
  // Paved surfaces
  asphalt: 'paved',
  paved: 'paved',
  concrete: 'paved',
  'concrete:plates': 'paved',
  'concrete:lanes': 'paved',
  paving_stones: 'paved',
  sett: 'paved',
  cobblestone: 'paved',
  metal: 'paved',
  wood: 'paved',
  // Gravel/compacted surfaces
  gravel: 'gravel',
  fine_gravel: 'gravel',
  compacted: 'gravel',
  pebblestone: 'gravel',
  // Unpaved surfaces
  unpaved: 'unpaved',
  dirt: 'unpaved',
  earth: 'unpaved',
  ground: 'unpaved',
  grass: 'unpaved',
  sand: 'unpaved',
  mud: 'unpaved',
  clay: 'unpaved',
  rock: 'unpaved',
};
