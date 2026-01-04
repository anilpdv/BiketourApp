// POI category types
export type POICategory =
  // Existing bike-touring categories
  | 'campsite'
  | 'drinking_water'
  | 'bike_shop'
  | 'bike_repair'
  | 'hotel'
  | 'hostel'
  | 'guest_house'
  | 'shelter'
  | 'supermarket'
  | 'restaurant'
  // New camping-focused categories
  | 'motorhome_spot'
  | 'service_area'
  | 'wild_camping'
  | 'caravan_site'
  | 'picnic_site'
  | 'toilet'
  | 'shower'
  | 'laundry';

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
  isDownloaded?: boolean; // true if POI was downloaded for offline use
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

// Extended filter state for advanced filtering UI
export interface POIFilterStateExtended extends POIFilterState {
  maxPrice: number | null; // Max price per night (null = no limit)
  minRating: number | null; // Minimum rating (null = no filter)
  hasElectricity: boolean | null; // Electric hookup
  hasWifi: boolean | null; // WiFi available
  isPetFriendly: boolean | null; // Pets allowed
  isOpenNow: boolean | null; // Currently open
}

// Category grouping for UI organization
export interface POICategoryGroup {
  id: string;
  name: string;
  icon: string;
  categories: POICategory[];
}

// Quick filter chip configuration
export interface QuickFilter {
  id: string;
  label: string;
  isActive: boolean;
  icon?: string;
}

// Extended POI with favorite status
export interface POIWithFavorite extends POI {
  isFavorite: boolean;
  favoriteNote?: string;
  favoritedAt?: string;
}
