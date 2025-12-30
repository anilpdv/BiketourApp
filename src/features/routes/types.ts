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
  distance: number;        // in km
  countries: string[];
  color: string;           // hex color for map display
  difficulty: 'easy' | 'moderate' | 'difficult';
  surface: string[];
  highlights: string[];
  bestSeason: string[];
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
