import { POI } from '../types';
import { formatDistanceKm } from '../../../shared/utils';

export interface POIContactInfo {
  phone?: string;
  website?: string;
  address?: string;
  openingHours?: string;
  description?: string;
}

export interface POIAmenities {
  wheelchair?: string;
  internet?: string;
  shower?: boolean;
  electricity?: boolean;
  drinkingWater?: boolean;
  capacity?: string;
  pets?: string;
  reservation?: string;
}

/**
 * Extract contact and address information from OSM tags
 */
export function extractContactInfo(tags: Record<string, string>): POIContactInfo {
  const addressParts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean);

  return {
    phone: tags['phone'] || tags['contact:phone'],
    website: tags['website'] || tags['contact:website'],
    address: addressParts.length > 0 ? addressParts.join(' ') : undefined,
    openingHours: tags['opening_hours'],
    description: tags['description'] || tags['note'],
  };
}

/**
 * Get contact info from POI
 */
export function getPOIContactInfo(poi: POI): POIContactInfo {
  return extractContactInfo(poi.tags);
}

// Re-export formatDistanceKm as formatDistance for backward compatibility
export { formatDistanceKm as formatDistance };

/**
 * Extract amenities information from OSM tags
 */
export function extractAmenities(tags: Record<string, string>): POIAmenities {
  return {
    wheelchair: tags['wheelchair'],
    internet: tags['internet_access'],
    shower: tags['shower'] === 'yes',
    electricity: tags['power_supply'] === 'yes' || tags['electricity'] === 'yes',
    drinkingWater: tags['drinking_water'] === 'yes',
    capacity: tags['capacity'],
    pets: tags['dog'] || tags['pets'],
    reservation: tags['reservation'],
  };
}

/**
 * Get amenities from POI
 */
export function getPOIAmenities(poi: POI): POIAmenities {
  return extractAmenities(poi.tags);
}

/**
 * Check if POI has any amenities to display
 */
export function hasAmenities(amenities: POIAmenities): boolean {
  return !!(
    amenities.wheelchair ||
    amenities.internet ||
    amenities.shower ||
    amenities.electricity ||
    amenities.drinkingWater ||
    amenities.capacity ||
    amenities.pets ||
    amenities.reservation
  );
}
