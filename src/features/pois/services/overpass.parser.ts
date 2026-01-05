/**
 * Overpass Response Parser
 * Functions to parse Overpass API responses into POI objects
 */

import { POI, POICategory, OverpassResponse, OverpassElement } from '../types';

/**
 * Essential tags to keep - reduces memory by ~80%
 */
const ESSENTIAL_TAGS = [
  // Basic info
  'name',
  'description',
  'note',
  // Contact
  'website',
  'phone',
  'email',
  'contact:phone',
  'contact:website',
  'opening_hours',
  // Address
  'addr:street',
  'addr:housenumber',
  'addr:city',
  'addr:postcode',
  'addr:country',
  // Site info
  'operator',
  'ref',
  'code',
  // Facilities
  'toilets',
  'toilets:fee',
  'toilet',
  'shower',
  'shower:fee',
  'washing_machine',
  'laundry',
  'waste_disposal',
  'sanitary_dump_station',
  'power_supply',
  'electricity',
  'internet_access',
  'wifi',
  'wifi:fee',
  'drinking_water',
  'water_point',
  'dog',
  'pets',
  'wheelchair',
  // Terrain/Capacity
  'fee',
  'capacity',
  'maxstay',
  'maxlength',
  'maxwidth',
  'surface',
  // Surroundings
  'sport',
  'leisure',
  'natural',
  // Ratings (rare in OSM but worth keeping)
  'stars',
  'rating',
  // Reservation
  'reservation',
];

/**
 * Determine POI category from OSM tags
 */
export function getCategoryFromTags(tags: Record<string, string>): POICategory | null {
  // Camping-focused categories
  if (tags.tourism === 'camp_site') return 'campsite';
  if (tags.tourism === 'caravan_site') return 'motorhome_spot'; // Map to motorhome_spot
  if (tags.tourism === 'camp_pitch') return 'wild_camping';

  // Services categories
  if (tags.amenity === 'sanitary_dump_station') return 'service_area';
  if (tags.amenity === 'drinking_water') return 'drinking_water';
  if (tags.amenity === 'toilets') return 'toilet';
  if (tags.amenity === 'shower') return 'shower';
  if (tags.shop === 'laundry') return 'laundry';

  // Accommodation categories
  if (tags.tourism === 'hotel') return 'hotel';
  if (tags.tourism === 'hostel') return 'hostel';
  if (tags.tourism === 'guest_house') return 'guest_house';
  if (tags.amenity === 'shelter') return 'shelter';

  // Bike categories
  if (tags.shop === 'bicycle') return 'bike_shop';
  if (tags.amenity === 'bicycle_repair_station') return 'bike_repair';

  // Food categories
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.shop === 'supermarket') return 'supermarket';
  if (tags.leisure === 'picnic_table') return 'picnic_site';

  // Emergency categories
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.amenity === 'pharmacy') return 'pharmacy';
  if (tags.amenity === 'police') return 'police';

  return null;
}

/**
 * Parse a single Overpass element to a POI
 */
export function parsePOIFromElement(element: OverpassElement): POI | null {
  const tags = element.tags || {};
  const category = getCategoryFromTags(tags);
  if (!category) return null;

  // Get coordinates (node has lat/lon, way has center)
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  // Strip unnecessary tags - keep only essential ones for memory efficiency
  const essentialTags: Record<string, string> = {};
  for (const key of ESSENTIAL_TAGS) {
    if (tags[key]) essentialTags[key] = tags[key];
  }

  return {
    id: `${element.type}/${element.id}`,
    type: element.type,
    category,
    name: tags.name || null,
    latitude: lat,
    longitude: lon,
    tags: essentialTags,
    isDownloaded: false,
  };
}

/**
 * Parse Overpass response to POIs
 */
export function parseOverpassResponse(response: OverpassResponse): POI[] {
  const pois: POI[] = [];

  for (const element of response.elements) {
    const poi = parsePOIFromElement(element);
    if (poi) {
      pois.push(poi);
    }
  }

  return pois;
}

/**
 * Filter POIs to only include specified categories
 */
export function filterPOIsByCategories(pois: POI[], categories: POICategory[]): POI[] {
  if (!categories || categories.length === 0) {
    return pois;
  }
  return pois.filter((poi) => categories.includes(poi.category));
}
