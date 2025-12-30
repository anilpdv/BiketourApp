import { SearchResult, GeocodeResult } from '../types';
import { createRateLimiter, logger } from '../../../shared/utils';
import { httpGet, ApiError } from '../../../shared/api';
import { API_CONFIG, getApiHeaders } from '../../../shared/config';

// Rate limiter for Nominatim API
const rateLimiter = createRateLimiter(API_CONFIG.search.rateLimit);

interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance: number;
  boundingbox: [string, string, string, string];
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface SearchOptions {
  limit?: number;
  countrycodes?: string; // Limit to specific countries, e.g., 'de,fr,at,ch'
  viewbox?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  bounded?: boolean; // If true, only results within viewbox
}

/**
 * Search for places using Nominatim
 */
export async function searchPlaces(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  await rateLimiter.waitForRateLimit();

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    addressdetails: '1',
    limit: String(options.limit || 10),
  });

  if (options.countrycodes) {
    params.append('countrycodes', options.countrycodes);
  }

  if (options.viewbox) {
    const { west, south, east, north } = options.viewbox;
    params.append('viewbox', `${west},${south},${east},${north}`);
    if (options.bounded) {
      params.append('bounded', '1');
    }
  }

  try {
    const url = `${API_CONFIG.search.baseUrl}/search?${params}`;
    const data = await httpGet<NominatimSearchResult[]>(url, {
      timeout: API_CONFIG.search.timeout,
      headers: getApiHeaders('search'),
    });

    return data.map((item) => ({
      id: `nominatim-${item.place_id}`,
      type: 'place' as const,
      name: extractPlaceName(item),
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      boundingBox: {
        south: parseFloat(item.boundingbox[0]),
        north: parseFloat(item.boundingbox[1]),
        west: parseFloat(item.boundingbox[2]),
        east: parseFloat(item.boundingbox[3]),
      },
      placeType: item.type,
      address: item.address
        ? {
            road: item.address.road,
            city: item.address.city || item.address.town || item.address.village,
            county: item.address.county,
            state: item.address.state,
            country: item.address.country,
            postcode: item.address.postcode,
          }
        : undefined,
    }));
  } catch (error) {
    logger.error('api', 'Nominatim search error', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  await rateLimiter.waitForRateLimit();

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    addressdetails: '1',
  });

  try {
    const url = `${API_CONFIG.search.baseUrl}/reverse?${params}`;
    const data = await httpGet<NominatimSearchResult>(url, {
      timeout: API_CONFIG.search.timeout,
      headers: getApiHeaders('search'),
    });

    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      displayName: data.display_name,
      address: {
        road: data.address?.road,
        houseNumber: data.address?.house_number,
        city: data.address?.city || data.address?.town || data.address?.village,
        county: data.address?.county,
        state: data.address?.state,
        country: data.address?.country,
        postcode: data.address?.postcode,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'NOT_FOUND') {
      return null; // No result for this location
    }
    logger.error('api', 'Nominatim reverse geocode error', error);
    throw error;
  }
}

/**
 * Extract a short name from the search result
 */
function extractPlaceName(result: NominatimSearchResult): string {
  // Try to get a meaningful short name
  const parts = result.display_name.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return result.display_name;
}

/**
 * Search specifically in Europe for bike tour planning
 */
export async function searchInEurope(
  query: string,
  options: Omit<SearchOptions, 'countrycodes'> = {}
): Promise<SearchResult[]> {
  // European country codes
  const europeCountryCodes = 'de,fr,at,ch,it,es,pt,nl,be,lu,gb,ie,dk,se,no,fi,pl,cz,sk,hu,si,hr,ba,rs,me,al,mk,gr,bg,ro,md,ua,by,lt,lv,ee';

  return searchPlaces(query, {
    ...options,
    countrycodes: europeCountryCodes,
  });
}
