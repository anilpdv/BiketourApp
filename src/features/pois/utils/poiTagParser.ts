import { POI, POICategory } from '../types';
import { formatDistanceKm } from '../../../shared/utils';

export interface POIContactInfo {
  phone?: string;
  website?: string;
  address?: string;
  street?: string;
  city?: string;
  postcode?: string;
  country?: string;
  openingHours?: string;
  description?: string;
  operator?: string;
  siteCode?: string;
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

// Facility with availability and cost info
export interface POIFacility {
  id: string;
  label: string;
  icon: string;
  available: boolean;
  fee?: boolean;  // true = has fee, false = free, undefined = unknown
}

// Terrain/capacity information for camping POIs
export interface POITerrain {
  maxStay?: string;
  capacity?: number;
  maxLength?: string;
  maxWidth?: string;
  surface?: string;
  fee?: string;
  feeAmount?: number;
}

// Surrounding activities
export interface POISurrounding {
  id: string;
  label: string;
  icon: string;
}

// Rating from OSM tags
export interface POIRatingInfo {
  stars?: number;
  rating?: number;
}

/**
 * Extract contact and address information from OSM tags
 */
export function extractContactInfo(tags: Record<string, string>): POIContactInfo {
  const street = tags['addr:street'];
  const housenumber = tags['addr:housenumber'];
  const city = tags['addr:city'];
  const postcode = tags['addr:postcode'];
  const country = tags['addr:country'];

  // Build formatted address
  const streetPart = [street, housenumber].filter(Boolean).join(' ');
  const addressParts = [streetPart, postcode, city, country].filter(Boolean);

  return {
    phone: tags['phone'] || tags['contact:phone'],
    website: tags['website'] || tags['contact:website'],
    address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
    street: streetPart || undefined,
    city: city,
    postcode: postcode,
    country: country,
    openingHours: tags['opening_hours'],
    description: tags['description'] || tags['note'],
    operator: tags['operator'],
    siteCode: tags['ref'] || tags['code'],
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

// Facility definitions with icons
const FACILITY_DEFINITIONS: { id: string; label: string; icon: string; tags: string[]; feeTag?: string }[] = [
  { id: 'toilet', label: 'Toilet', icon: 'toilet', tags: ['toilets', 'toilet'], feeTag: 'toilets:fee' },
  { id: 'shower', label: 'Shower', icon: 'shower-head', tags: ['shower'], feeTag: 'shower:fee' },
  { id: 'washing_machine', label: 'Washing machine', icon: 'washing-machine', tags: ['washing_machine', 'laundry'] },
  { id: 'trash', label: 'Trash disposal', icon: 'trash-can-outline', tags: ['waste_disposal', 'sanitary_dump_station'] },
  { id: 'electricity', label: 'Electricity', icon: 'lightning-bolt', tags: ['power_supply', 'electricity'] },
  { id: 'wifi', label: 'WiFi', icon: 'wifi', tags: ['internet_access', 'wifi'], feeTag: 'wifi:fee' },
  { id: 'drinking_water', label: 'Drinking water', icon: 'water', tags: ['drinking_water', 'water_point'] },
  { id: 'dogs', label: 'Dogs allowed', icon: 'dog', tags: ['dog', 'pets'] },
  { id: 'wheelchair', label: 'Wheelchair accessible', icon: 'wheelchair-accessibility', tags: ['wheelchair'] },
];

/**
 * Extract facilities with availability and fee info from OSM tags
 */
export function extractFacilities(tags: Record<string, string>): POIFacility[] {
  const facilities: POIFacility[] = [];

  for (const def of FACILITY_DEFINITIONS) {
    // Check if any of the tags indicate this facility is available
    let available = false;
    for (const tag of def.tags) {
      const value = tags[tag];
      if (value === 'yes' || value === 'true' || (value && value !== 'no' && value !== 'false')) {
        available = true;
        break;
      }
    }

    if (available) {
      // Check for fee info
      let fee: boolean | undefined = undefined;
      if (def.feeTag && tags[def.feeTag]) {
        const feeValue = tags[def.feeTag].toLowerCase();
        fee = feeValue === 'yes' || feeValue === 'true';
      }
      // Also check general fee tag patterns
      const generalFee = tags['fee'];
      if (generalFee === 'yes') {
        fee = true;
      } else if (generalFee === 'no') {
        fee = false;
      }

      facilities.push({
        id: def.id,
        label: def.label,
        icon: def.icon,
        available: true,
        fee,
      });
    }
  }

  return facilities;
}

/**
 * Get facilities from POI
 */
export function getPOIFacilities(poi: POI): POIFacility[] {
  return extractFacilities(poi.tags);
}

/**
 * Extract terrain/capacity info from OSM tags
 */
export function extractTerrain(tags: Record<string, string>): POITerrain {
  const terrain: POITerrain = {};

  if (tags['maxstay']) {
    terrain.maxStay = tags['maxstay'];
  }

  if (tags['capacity']) {
    const cap = parseInt(tags['capacity'], 10);
    if (!isNaN(cap)) {
      terrain.capacity = cap;
    }
  }

  if (tags['maxlength']) {
    terrain.maxLength = tags['maxlength'];
  }

  if (tags['maxwidth']) {
    terrain.maxWidth = tags['maxwidth'];
  }

  if (tags['surface']) {
    terrain.surface = tags['surface'];
  }

  if (tags['fee']) {
    terrain.fee = tags['fee'];
    // Try to extract numeric fee amount
    const feeMatch = tags['fee'].match(/(\d+(?:[.,]\d+)?)/);
    if (feeMatch) {
      terrain.feeAmount = parseFloat(feeMatch[1].replace(',', '.'));
    }
  }

  return terrain;
}

/**
 * Get terrain info from POI
 */
export function getPOITerrain(poi: POI): POITerrain {
  return extractTerrain(poi.tags);
}

/**
 * Check if POI has terrain info to display
 */
export function hasTerrain(terrain: POITerrain): boolean {
  return !!(
    terrain.maxStay ||
    terrain.capacity ||
    terrain.maxLength ||
    terrain.maxWidth ||
    terrain.surface ||
    terrain.fee
  );
}

// Surrounding activity definitions
const SURROUNDING_DEFINITIONS: { id: string; label: string; icon: string; tags: Record<string, string[]> }[] = [
  { id: 'cycling', label: 'Cycling', icon: 'bike', tags: { sport: ['cycling'], leisure: ['cycling'] } },
  { id: 'hiking', label: 'Hiking', icon: 'hiking', tags: { sport: ['hiking'], leisure: ['hiking'] } },
  { id: 'swimming', label: 'Swimming', icon: 'swim', tags: { sport: ['swimming'], leisure: ['swimming_pool', 'swimming_area'] } },
  { id: 'marina', label: 'Marina nearby', icon: 'sailboat', tags: { leisure: ['marina'], amenity: ['boat_rental'] } },
  { id: 'fishing', label: 'Fishing', icon: 'fish', tags: { leisure: ['fishing'], sport: ['fishing'] } },
  { id: 'playground', label: 'Playground', icon: 'human-child', tags: { leisure: ['playground'] } },
];

/**
 * Extract surrounding activities from OSM tags
 */
export function extractSurroundings(tags: Record<string, string>): POISurrounding[] {
  const surroundings: POISurrounding[] = [];

  for (const def of SURROUNDING_DEFINITIONS) {
    let found = false;

    for (const [tagKey, validValues] of Object.entries(def.tags)) {
      const tagValue = tags[tagKey];
      if (tagValue && validValues.includes(tagValue)) {
        found = true;
        break;
      }
    }

    if (found) {
      surroundings.push({
        id: def.id,
        label: def.label,
        icon: def.icon,
      });
    }
  }

  return surroundings;
}

/**
 * Get surroundings from POI
 */
export function getPOISurroundings(poi: POI): POISurrounding[] {
  return extractSurroundings(poi.tags);
}

/**
 * Extract rating info from OSM tags (rarely available but worth checking)
 */
export function extractRating(tags: Record<string, string>): POIRatingInfo {
  const rating: POIRatingInfo = {};

  if (tags['stars']) {
    const stars = parseInt(tags['stars'], 10);
    if (!isNaN(stars) && stars >= 1 && stars <= 5) {
      rating.stars = stars;
    }
  }

  if (tags['rating']) {
    const r = parseFloat(tags['rating']);
    if (!isNaN(r) && r >= 0 && r <= 5) {
      rating.rating = r;
    }
  }

  return rating;
}

/**
 * Get rating from POI
 */
export function getPOIRating(poi: POI): POIRatingInfo {
  return extractRating(poi.tags);
}

/**
 * Check if POI is a camping-type category (for showing terrain info)
 */
export function isCampingCategory(category: POICategory): boolean {
  return [
    'campsite',
    'motorhome_spot',
    'caravan_site',
    'wild_camping',
    'service_area',
  ].includes(category);
}
