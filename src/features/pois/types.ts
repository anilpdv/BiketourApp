// POI category types
export type POICategory =
  | 'campsite'
  | 'drinking_water'
  | 'bike_shop'
  | 'bike_repair'
  | 'hotel'
  | 'hostel'
  | 'guest_house'
  | 'shelter'
  | 'supermarket'
  | 'restaurant';

// POI from OpenStreetMap
export interface POI {
  id: string;
  type: 'node' | 'way' | 'relation';
  category: POICategory;
  name: string | null;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
  distanceFromUser?: number;
  distanceAlongRoute?: number;
}

// POI category configuration
export interface POICategoryConfig {
  id: POICategory;
  name: string;
  icon: string;
  color: string;
  osmQuery: string;
  enabled: boolean;
}

// Re-export BoundingBox from shared types
export { BoundingBox } from '../../shared/types/geo.types';

// Overpass API response
export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// POI filter state
export interface POIFilterState {
  categories: POICategory[];
  maxDistance: number; // km from route
  showOnMap: boolean;
}

// Extended POI with favorite status
export interface POIWithFavorite extends POI {
  isFavorite: boolean;
  favoriteNote?: string;
  favoritedAt?: string;
}
