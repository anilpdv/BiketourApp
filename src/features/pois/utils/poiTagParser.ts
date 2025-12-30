import { POI } from '../types';

export interface POIContactInfo {
  phone?: string;
  website?: string;
  address?: string;
  openingHours?: string;
  description?: string;
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

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number | undefined): string | null {
  if (distanceKm === undefined) return null;

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
