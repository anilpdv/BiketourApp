/**
 * Overpass API Service
 * Simplified for offline-first approach - only used for explicit downloads
 */

import { POI, POICategory, POICategoryConfig, BoundingBox, OverpassResponse } from '../types';
import {
  createRateLimiter,
  calculateHaversineDistance,
  logger,
  getBoundingBox,
  isAbortError,
} from '../../../shared/utils';
import { API_CONFIG } from '../../../shared/config';
import { fetchWithTimeout } from '../../../shared/api/httpClient';

// Import from split modules
import { POI_CATEGORIES, getCategoryConfigs } from '../config/poiCategoryConfig';
import { buildMultiCategoryQuery } from './overpass.query';
import { parseOverpassResponse } from './overpass.parser';

// Re-export for backwards compatibility
export { POI_CATEGORIES } from '../config/poiCategoryConfig';
export { buildMultiCategoryQuery } from './overpass.query';
export { parseOverpassResponse, getCategoryFromTags } from './overpass.parser';

// Rate limiter for Overpass API
const rateLimiter = createRateLimiter(API_CONFIG.pois.rateLimit);

// Wait for rate limit
async function waitForRateLimit(): Promise<void> {
  await rateLimiter.waitForRateLimit();
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch POIs for a bounding box from Overpass API
 * Used during explicit POI downloads (not real-time fetching)
 * When no categories specified, fetches ALL categories
 */
export async function fetchPOIs(
  bbox: BoundingBox,
  categories?: POICategory[],
  signal?: AbortSignal
): Promise<POI[]> {
  // Check if already aborted
  if (signal?.aborted) {
    return [];
  }

  await waitForRateLimit();

  // If no categories specified, fetch ALL categories
  const categoriesToFetch = (!categories || categories.length === 0)
    ? POI_CATEGORIES
    : getCategoryConfigs(categories);

  if (categoriesToFetch.length === 0) {
    return [];
  }

  const query = buildMultiCategoryQuery(bbox, categoriesToFetch);

  try {
    const response = await fetchWithTimeout(
      API_CONFIG.pois.baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: `data=${encodeURIComponent(query)}`,
      },
      API_CONFIG.pois.timeout,
      signal
    );

    if (response.ok) {
      const data: OverpassResponse = await response.json();
      return parseOverpassResponse(data);
    }

    // Rate limited or server error - one retry (skip if aborted)
    if (!signal?.aborted && (response.status === 429 || response.status >= 500)) {
      await sleep(2000);
      const retry = await fetchWithTimeout(
        API_CONFIG.pois.baseUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: `data=${encodeURIComponent(query)}`,
        },
        API_CONFIG.pois.timeout,
        signal
      );
      if (retry.ok) {
        const data: OverpassResponse = await retry.json();
        return parseOverpassResponse(data);
      }
    }

    return [];
  } catch (error: unknown) {
    if (isAbortError(error)) {
      logger.warn('poi', 'POI fetch aborted (timeout or cancelled)');
    } else {
      logger.warn('api', 'POI fetch failed', error);
    }
    return [];
  }
}

/**
 * Fetch POIs along a route corridor
 * Used during route-based POI downloads
 */
export async function fetchPOIsAlongRoute(
  routePoints: Array<{ latitude: number; longitude: number }>,
  corridorKm: number = 10,
  categories?: POICategory[]
): Promise<POI[]> {
  if (routePoints.length === 0) return [];

  const bounds = getBoundingBox(routePoints, corridorKm);
  if (!bounds) return [];

  const bbox: BoundingBox = {
    south: bounds.south,
    north: bounds.north,
    west: bounds.west,
    east: bounds.east,
  };

  return fetchPOIs(bbox, categories);
}

// Re-export calculateHaversineDistance as calculateDistance for backwards compatibility
export { calculateHaversineDistance as calculateDistance } from '../../../shared/utils';

/**
 * Add distance from user to POIs
 */
export function addDistanceFromUser(
  pois: POI[],
  userLat: number,
  userLon: number
): POI[] {
  return pois.map((poi) => ({
    ...poi,
    distanceFromUser: calculateHaversineDistance(
      userLat,
      userLon,
      poi.latitude,
      poi.longitude
    ),
  }));
}

/**
 * Sort POIs by distance from user
 */
export function sortByDistance(pois: POI[]): POI[] {
  return [...pois].sort(
    (a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0)
  );
}

/**
 * Get category configuration
 */
export function getCategoryConfig(
  category: POICategory
): POICategoryConfig | undefined {
  return POI_CATEGORIES.find((c) => c.id === category);
}
