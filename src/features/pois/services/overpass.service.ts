import {
  POI,
  POICategory,
  POICategoryConfig,
  BoundingBox,
  OverpassResponse,
  OverpassElement,
} from '../types';
import { poiRepository } from './poi.repository';

// Overpass API endpoint
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// Rate limiting: max 1 request per 2 seconds
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;
const REQUEST_TIMEOUT = 30000;

// Request deduplication: track pending requests to avoid duplicate API calls
const pendingRequests = new Map<string, Promise<POI[]>>();

/**
 * Generate a key for deduplicating requests based on bounding box
 * Uses 2 decimal places for reasonable grouping
 */
function getBboxKey(bbox: BoundingBox): string {
  return `${bbox.south.toFixed(2)}_${bbox.north.toFixed(2)}_${bbox.west.toFixed(2)}_${bbox.east.toFixed(2)}`;
}

// POI category configurations
export const POI_CATEGORIES: POICategoryConfig[] = [
  {
    id: 'campsite',
    name: 'Campsites',
    icon: 'tent',
    color: '#4CAF50',
    osmQuery: 'tourism=camp_site',
    enabled: true,
  },
  {
    id: 'drinking_water',
    name: 'Drinking Water',
    icon: 'water',
    color: '#2196F3',
    osmQuery: 'amenity=drinking_water',
    enabled: true,
  },
  {
    id: 'bike_shop',
    name: 'Bike Shops',
    icon: 'bicycle',
    color: '#FF9800',
    osmQuery: 'shop=bicycle',
    enabled: true,
  },
  {
    id: 'bike_repair',
    name: 'Repair Stations',
    icon: 'wrench',
    color: '#9C27B0',
    osmQuery: 'amenity=bicycle_repair_station',
    enabled: true,
  },
  {
    id: 'hotel',
    name: 'Hotels',
    icon: 'hotel',
    color: '#3F51B5',
    osmQuery: 'tourism=hotel',
    enabled: true,
  },
  {
    id: 'hostel',
    name: 'Hostels',
    icon: 'bed',
    color: '#009688',
    osmQuery: 'tourism=hostel',
    enabled: true,
  },
  {
    id: 'guest_house',
    name: 'Guest Houses',
    icon: 'home',
    color: '#795548',
    osmQuery: 'tourism=guest_house',
    enabled: true,
  },
  {
    id: 'shelter',
    name: 'Shelters',
    icon: 'shelter',
    color: '#607D8B',
    osmQuery: 'amenity=shelter',
    enabled: true,
  },
  {
    id: 'supermarket',
    name: 'Supermarkets',
    icon: 'cart',
    color: '#795548',
    osmQuery: 'shop=supermarket',
    enabled: false,
  },
  {
    id: 'restaurant',
    name: 'Restaurants',
    icon: 'utensils',
    color: '#E91E63',
    osmQuery: 'amenity=restaurant',
    enabled: false,
  },
];

// Wait for rate limit
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

// Build Overpass query for a bounding box and category
function buildOverpassQuery(bbox: BoundingBox, category: POICategoryConfig): string {
  const { south, west, north, east } = bbox;
  const [key, value] = category.osmQuery.split('=');

  return `
    [out:json][timeout:25];
    (
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    );
    out center;
  `;
}

// Build query for multiple categories
function buildMultiCategoryQuery(
  bbox: BoundingBox,
  categories: POICategoryConfig[]
): string {
  const { south, west, north, east } = bbox;

  const queries = categories
    .map((cat) => {
      const [key, value] = cat.osmQuery.split('=');
      return `
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    `;
    })
    .join('\n');

  return `
    [out:json][timeout:30];
    (
      ${queries}
    );
    out center;
  `;
}

// Determine POI category from OSM tags
function getCategoryFromTags(tags: Record<string, string>): POICategory | null {
  if (tags.tourism === 'camp_site') return 'campsite';
  if (tags.amenity === 'drinking_water') return 'drinking_water';
  if (tags.shop === 'bicycle') return 'bike_shop';
  if (tags.amenity === 'bicycle_repair_station') return 'bike_repair';
  if (tags.tourism === 'hotel') return 'hotel';
  if (tags.tourism === 'hostel') return 'hostel';
  if (tags.tourism === 'guest_house') return 'guest_house';
  if (tags.amenity === 'shelter') return 'shelter';
  if (tags.shop === 'supermarket') return 'supermarket';
  if (tags.amenity === 'restaurant') return 'restaurant';
  return null;
}

// Parse Overpass response to POIs
function parseOverpassResponse(response: OverpassResponse): POI[] {
  const pois: POI[] = [];

  for (const element of response.elements) {
    const tags = element.tags || {};
    const category = getCategoryFromTags(tags);
    if (!category) continue;

    // Get coordinates (node has lat/lon, way has center)
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    pois.push({
      id: `${element.type}/${element.id}`,
      type: element.type,
      category,
      name: tags.name || null,
      latitude: lat,
      longitude: lon,
      tags,
    });
  }

  return pois;
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch POIs for a bounding box
export async function fetchPOIs(
  bbox: BoundingBox,
  categories?: POICategory[]
): Promise<POI[]> {
  await waitForRateLimit();

  const categoriesToFetch = categories
    ? POI_CATEGORIES.filter((c) => categories.includes(c.id))
    : POI_CATEGORIES.filter((c) => c.enabled);

  if (categoriesToFetch.length === 0) {
    return [];
  }

  const query = buildMultiCategoryQuery(bbox, categoriesToFetch);

  try {
    const response = await fetchWithTimeout(
      OVERPASS_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      },
      REQUEST_TIMEOUT
    );

    if (response.ok) {
      const data: OverpassResponse = await response.json();
      return parseOverpassResponse(data);
    }

    // Rate limited or server error - one retry
    if (response.status === 429 || response.status >= 500) {
      await sleep(2000);
      const retry = await fetchWithTimeout(
        OVERPASS_ENDPOINT,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        REQUEST_TIMEOUT
      );
      if (retry.ok) {
        const data: OverpassResponse = await retry.json();
        return parseOverpassResponse(data);
      }
    }

    return [];
  } catch (error: any) {
    console.warn('POI fetch failed:', error.message);
    return [];
  }
}

// Fetch POIs along a route corridor
export async function fetchPOIsAlongRoute(
  routePoints: Array<{ latitude: number; longitude: number }>,
  corridorKm: number = 10,
  categories?: POICategory[]
): Promise<POI[]> {
  if (routePoints.length === 0) return [];

  // Calculate bounding box that encompasses the route + corridor
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const point of routePoints) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  // Add corridor buffer (roughly convert km to degrees)
  const latBuffer = corridorKm / 111; // ~111km per degree latitude
  const lonBuffer = corridorKm / (111 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180));

  const bbox: BoundingBox = {
    south: minLat - latBuffer,
    north: maxLat + latBuffer,
    west: minLon - lonBuffer,
    east: maxLon + lonBuffer,
  };

  return fetchPOIs(bbox, categories);
}

// Calculate distance between two points (Haversine)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Add distance from user to POIs
export function addDistanceFromUser(
  pois: POI[],
  userLat: number,
  userLon: number
): POI[] {
  return pois.map((poi) => ({
    ...poi,
    distanceFromUser: calculateDistance(
      userLat,
      userLon,
      poi.latitude,
      poi.longitude
    ),
  }));
}

// Sort POIs by distance from user
export function sortByDistance(pois: POI[]): POI[] {
  return [...pois].sort(
    (a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0)
  );
}

// Get category config
export function getCategoryConfig(
  category: POICategory
): POICategoryConfig | undefined {
  return POI_CATEGORIES.find((c) => c.id === category);
}

/**
 * Fetch POIs with cache-first strategy and request deduplication
 * 1. Check if request for this area is already in flight (deduplication)
 * 2. Check if tile is cached and valid
 * 3. If cached, return from database
 * 4. If not cached, fetch from Overpass API and save to database
 */
export async function fetchPOIsWithCache(
  bbox: BoundingBox,
  categories?: POICategory[]
): Promise<POI[]> {
  const bboxKey = getBboxKey(bbox);

  // Check if request for this area is already pending (deduplication)
  const pendingRequest = pendingRequests.get(bboxKey);
  if (pendingRequest) {
    const pois = await pendingRequest;
    // Filter by categories if specified
    if (categories && categories.length > 0) {
      return pois.filter((poi) => categories.includes(poi.category));
    }
    return pois;
  }

  // Create new request promise
  const requestPromise = (async (): Promise<POI[]> => {
    try {
      // Check if this area is already cached
      const isCached = await poiRepository.isTileCached(bbox);

      if (isCached) {
        // Return from cache
        const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
        return cachedPOIs;
      }

      // Not cached - fetch from Overpass API
      const freshPOIs = await fetchPOIs(bbox, categories);

      // Save to cache (async, don't block return)
      if (freshPOIs.length > 0) {
        poiRepository.savePOIs(freshPOIs, bbox).catch((error) => {
          console.warn('Failed to cache POIs:', error);
        });
      }

      return freshPOIs;
    } catch (error) {
      console.warn('fetchPOIsWithCache error:', error);
      // Fallback to direct API call
      return fetchPOIs(bbox, categories);
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(bboxKey);
    }
  })();

  // Track the pending request
  pendingRequests.set(bboxKey, requestPromise);

  const pois = await requestPromise;

  // Filter by categories if specified
  if (categories && categories.length > 0) {
    return pois.filter((poi) => categories.includes(poi.category));
  }

  return pois;
}

/**
 * Progressive loading: show cached POIs immediately, fetch fresh data in background
 * This provides instant visual feedback while ensuring data freshness
 */
export async function fetchPOIsProgressively(
  bbox: BoundingBox,
  onCachedData: (pois: POI[]) => void,
  onFreshData: (pois: POI[]) => void,
  categories?: POICategory[]
): Promise<void> {
  try {
    // 1. Immediately return cached data if available
    const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
    if (cachedPOIs.length > 0) {
      const filtered = categories && categories.length > 0
        ? cachedPOIs.filter((poi) => categories.includes(poi.category))
        : cachedPOIs;
      onCachedData(filtered);
    }

    // 2. Check if cache is still valid
    const isCached = await poiRepository.isTileCached(bbox);
    if (isCached) {
      // Cache is fresh, no need to fetch
      return;
    }

    // 3. Fetch fresh data in background
    const freshPOIs = await fetchPOIs(bbox, categories);

    // 4. Save to cache
    if (freshPOIs.length > 0) {
      await poiRepository.savePOIs(freshPOIs, bbox);
    }

    // 5. Notify with fresh data
    const filtered = categories && categories.length > 0
      ? freshPOIs.filter((poi) => categories.includes(poi.category))
      : freshPOIs;
    onFreshData(filtered);
  } catch (error) {
    console.warn('fetchPOIsProgressively error:', error);
  }
}

/**
 * Fetch POIs for only the uncached tiles in a viewport
 * This is more efficient than fetching the entire bounding box
 */
export async function fetchPOIsForViewport(
  bbox: BoundingBox,
  categories?: POICategory[],
  onProgress?: (loaded: number, total: number) => void
): Promise<POI[]> {
  const allPOIs: POI[] = [];

  // Get uncached tiles
  const uncachedTiles = await poiRepository.getUncachedTiles(bbox);

  // If all tiles are cached, just return from cache
  if (uncachedTiles.length === 0) {
    const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
    if (categories && categories.length > 0) {
      return cachedPOIs.filter(poi => categories.includes(poi.category));
    }
    return cachedPOIs;
  }

  // Get cached POIs first
  const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
  allPOIs.push(...cachedPOIs);

  // Fetch uncached tiles (with rate limiting between each)
  let loaded = 0;
  for (const tile of uncachedTiles) {
    try {
      const freshPOIs = await fetchPOIs(tile, categories);
      allPOIs.push(...freshPOIs);

      // Cache the fresh POIs
      if (freshPOIs.length > 0) {
        await poiRepository.savePOIs(freshPOIs, tile);
      }

      loaded++;
      onProgress?.(loaded, uncachedTiles.length);
    } catch (error) {
      console.warn(`Failed to fetch tile:`, error);
    }
  }

  // Deduplicate POIs by ID (in case of overlap)
  const uniquePOIs = new Map<string, POI>();
  for (const poi of allPOIs) {
    uniquePOIs.set(poi.id, poi);
  }

  const result = Array.from(uniquePOIs.values());

  if (categories && categories.length > 0) {
    return result.filter(poi => categories.includes(poi.category));
  }

  return result;
}

/**
 * Fetch POIs along route with cache-first strategy
 */
export async function fetchPOIsAlongRouteWithCache(
  routePoints: Array<{ latitude: number; longitude: number }>,
  corridorKm: number = 10,
  categories?: POICategory[]
): Promise<POI[]> {
  if (routePoints.length === 0) return [];

  // Calculate bounding box that encompasses the route + corridor
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const point of routePoints) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  // Add corridor buffer (roughly convert km to degrees)
  const latBuffer = corridorKm / 111;
  const lonBuffer = corridorKm / (111 * Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180)));

  const bbox: BoundingBox = {
    south: minLat - latBuffer,
    north: maxLat + latBuffer,
    west: minLon - lonBuffer,
    east: maxLon + lonBuffer,
  };

  return fetchPOIsWithCache(bbox, categories);
}
