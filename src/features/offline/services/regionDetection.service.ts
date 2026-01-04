/**
 * Region Detection Service
 * Uses Nominatim (OpenStreetMap) reverse geocoding to detect
 * the administrative region (state/province) for a given location.
 */

import { BoundingBox } from '../../../shared/types/geo.types';
import { logger } from '../../../shared/utils';

// Cache for region lookups to avoid repeated API calls
const regionCache = new Map<string, RegionInfo>();
const CACHE_KEY_PRECISION = 2; // Round to 2 decimal places (~1km precision)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'BikeTourEurope/1.0';

export interface RegionInfo {
  country: string;
  countryCode: string;
  region: string; // State/Province name (e.g., "Central Finland")
  displayName: string; // Full display name (e.g., "Central Finland, Finland")
  boundingBox: BoundingBox;
}

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    state?: string;
    region?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string]; // [south, north, west, east]
}

/**
 * Generate cache key from coordinates
 */
function getCacheKey(lat: number, lon: number): string {
  const roundedLat = lat.toFixed(CACHE_KEY_PRECISION);
  const roundedLon = lon.toFixed(CACHE_KEY_PRECISION);
  return `${roundedLat},${roundedLon}`;
}

/**
 * Detect the administrative region for a given location
 * Uses Nominatim reverse geocoding with zoom level 6 (state/province level)
 *
 * @param lat Latitude
 * @param lon Longitude
 * @returns RegionInfo or null if detection fails
 */
export async function detectCurrentRegion(
  lat: number,
  lon: number
): Promise<RegionInfo | null> {
  const cacheKey = getCacheKey(lat, lon);

  // Check cache first
  const cached = regionCache.get(cacheKey);
  if (cached) {
    logger.info('offline', 'Region cache hit', { region: cached.displayName });
    return cached;
  }

  try {
    // Nominatim rate limit: 1 request/second - this is handled by caller via debouncing
    const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('zoom', '6'); // State/province level
    url.searchParams.set('addressdetails', '1');

    logger.info('offline', 'Detecting region', { lat, lon });

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn('offline', 'Nominatim request failed', { status: response.status });
      return null;
    }

    const data: NominatimResponse = await response.json();

    if (!data.address) {
      logger.warn('offline', 'No address data in response');
      return null;
    }

    // Extract region name - try state, region, then county
    const regionName =
      data.address.state ||
      data.address.region ||
      data.address.county ||
      'Unknown Region';

    const countryName = data.address.country || 'Unknown Country';
    const countryCode = data.address.country_code?.toUpperCase() || '';

    // Parse bounding box [south, north, west, east]
    const [south, north, west, east] = data.boundingbox.map(parseFloat);

    const regionInfo: RegionInfo = {
      country: countryName,
      countryCode,
      region: regionName,
      displayName: `${regionName}, ${countryName}`,
      boundingBox: { south, north, west, east },
    };

    // Cache the result
    regionCache.set(cacheKey, regionInfo);

    logger.info('offline', 'Region detected', {
      region: regionInfo.displayName,
      bounds: regionInfo.boundingBox,
    });

    return regionInfo;
  } catch (error) {
    logger.error('offline', 'Failed to detect region', error);
    return null;
  }
}

/**
 * Get region info from cache without making API call
 */
export function getRegionFromCache(lat: number, lon: number): RegionInfo | null {
  const cacheKey = getCacheKey(lat, lon);
  return regionCache.get(cacheKey) || null;
}

/**
 * Clear the region cache
 */
export function clearRegionCache(): void {
  regionCache.clear();
}

/**
 * Check if a point is within a region's bounding box
 */
export function isPointInRegion(
  lat: number,
  lon: number,
  region: RegionInfo
): boolean {
  const { boundingBox } = region;
  return (
    lat >= boundingBox.south &&
    lat <= boundingBox.north &&
    lon >= boundingBox.west &&
    lon <= boundingBox.east
  );
}

/**
 * Calculate approximate size of a region in square kilometers
 */
export function calculateRegionArea(boundingBox: BoundingBox): number {
  const latDiff = boundingBox.north - boundingBox.south;
  const lonDiff = boundingBox.east - boundingBox.west;

  // Approximate conversion: 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 * cos(latitude) km
  const midLat = (boundingBox.north + boundingBox.south) / 2;
  const latKm = latDiff * 111;
  const lonKm = lonDiff * 111 * Math.cos((midLat * Math.PI) / 180);

  return Math.round(latKm * lonKm);
}
