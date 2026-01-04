import {
  POI,
  POICategory,
  POICategoryConfig,
  BoundingBox,
  OverpassResponse,
  OverpassElement,
} from '../types';
// Use WatermelonDB repository for native thread performance
import { poiRepositoryWM as poiRepository } from './poi.repository.watermelon';
import {
  createRateLimiter,
  calculateHaversineDistance,
  logger,
  findNearestPointOnRoute,
  getRouteSegmentAhead,
  getBoundingBox,
  splitRouteIntoSegments,
  isAbortError,
} from '../../../shared/utils';
import { API_CONFIG } from '../../../shared/config';
import { fetchWithTimeout } from '../../../shared/api/httpClient';

// Rate limiter for Overpass API
const rateLimiter = createRateLimiter(API_CONFIG.pois.rateLimit);

// Request deduplication: track pending requests to avoid duplicate API calls
const pendingRequests = new Map<string, Promise<POI[]>>();

/**
 * Generate a key for deduplicating requests based on bounding box and categories
 * Uses 2 decimal places for reasonable grouping
 * Includes categories to prevent returning wrong POIs for concurrent requests
 */
function getBboxKey(bbox: BoundingBox, categories?: POICategory[]): string {
  const categoryStr = categories?.slice().sort().join(',') ?? 'all';
  return `${bbox.south.toFixed(2)}_${bbox.north.toFixed(2)}_${bbox.west.toFixed(2)}_${bbox.east.toFixed(2)}_${categoryStr}`;
}

// POI category configurations
// All categories are disabled by default - only explicitly selected categories are fetched
export const POI_CATEGORIES: POICategoryConfig[] = [
  // Camping-focused categories (primary)
  {
    id: 'campsite',
    name: 'Campsites',
    icon: 'tent',
    color: '#228B22',
    osmQuery: 'tourism=camp_site',
    enabled: false,
  },
  {
    id: 'motorhome_spot',
    name: 'Motorhome Spots',
    icon: 'caravan',
    color: '#6B5B95',
    osmQuery: 'tourism=caravan_site',
    enabled: false,
  },
  {
    id: 'caravan_site',
    name: 'Caravan Sites',
    icon: 'rv-truck',
    color: '#FF6B35',
    osmQuery: 'tourism=caravan_site',
    enabled: false,
  },
  {
    id: 'wild_camping',
    name: 'Wild Camping',
    icon: 'pine-tree',
    color: '#2D5016',
    osmQuery: 'tourism=camp_pitch',
    enabled: false,
  },
  // Services categories
  {
    id: 'service_area',
    name: 'Service Areas',
    icon: 'gas-station',
    color: '#45B7D1',
    osmQuery: 'amenity=sanitary_dump_station',
    enabled: false,
  },
  {
    id: 'drinking_water',
    name: 'Drinking Water',
    icon: 'water',
    color: '#1E90FF',
    osmQuery: 'amenity=drinking_water',
    enabled: false,
  },
  {
    id: 'toilet',
    name: 'Toilets',
    icon: 'toilet',
    color: '#7A8B8B',
    osmQuery: 'amenity=toilets',
    enabled: false,
  },
  {
    id: 'shower',
    name: 'Showers',
    icon: 'shower',
    color: '#4ECDC4',
    osmQuery: 'amenity=shower',
    enabled: false,
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: 'washing-machine',
    color: '#FFE66D',
    osmQuery: 'shop=laundry',
    enabled: false,
  },
  // Accommodation categories
  {
    id: 'hotel',
    name: 'Hotels',
    icon: 'hotel',
    color: '#9370DB',
    osmQuery: 'tourism=hotel',
    enabled: false,
  },
  {
    id: 'hostel',
    name: 'Hostels',
    icon: 'bed',
    color: '#20B2AA',
    osmQuery: 'tourism=hostel',
    enabled: false,
  },
  {
    id: 'guest_house',
    name: 'Guest Houses',
    icon: 'home',
    color: '#DEB887',
    osmQuery: 'tourism=guest_house',
    enabled: false,
  },
  {
    id: 'shelter',
    name: 'Shelters',
    icon: 'shelter',
    color: '#8B4513',
    osmQuery: 'amenity=shelter',
    enabled: false,
  },
  // Bike categories
  {
    id: 'bike_shop',
    name: 'Bike Shops',
    icon: 'bicycle',
    color: '#FF6347',
    osmQuery: 'shop=bicycle',
    enabled: false,
  },
  {
    id: 'bike_repair',
    name: 'Repair Stations',
    icon: 'wrench',
    color: '#FF8C00',
    osmQuery: 'amenity=bicycle_repair_station',
    enabled: false,
  },
  // Food categories
  {
    id: 'restaurant',
    name: 'Restaurants',
    icon: 'utensils',
    color: '#DC143C',
    osmQuery: 'amenity=restaurant',
    enabled: false,
  },
  {
    id: 'supermarket',
    name: 'Supermarkets',
    icon: 'cart',
    color: '#32CD32',
    osmQuery: 'shop=supermarket',
    enabled: false,
  },
  {
    id: 'picnic_site',
    name: 'Picnic Sites',
    icon: 'table-picnic',
    color: '#98D8C8',
    osmQuery: 'leisure=picnic_table',
    enabled: false,
  },
];

// Wait for rate limit
async function waitForRateLimit(): Promise<void> {
  await rateLimiter.waitForRateLimit();
}

// Build Overpass query for a bounding box and category
function buildOverpassQuery(bbox: BoundingBox, category: POICategoryConfig): string {
  const { south, west, north, east } = bbox;
  const [key, value] = category.osmQuery.split('=');

  return `
    [out:json][timeout:8];
    (
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    );
    out center;
  `;
}

// Build query for multiple categories (exported for bulk downloads)
export function buildMultiCategoryQuery(
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
    [out:json][timeout:8];
    (
      ${queries}
    );
    out center;
  `;
}

// Determine POI category from OSM tags
function getCategoryFromTags(tags: Record<string, string>): POICategory | null {
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

  return null;
}

// Parse Overpass response to POIs
// Essential tags to keep - reduces memory by ~80%
const ESSENTIAL_TAGS = [
  'name', 'website', 'phone', 'email', 'opening_hours',
  'fee', 'capacity', 'addr:street', 'addr:city', 'description'
];

// Parse Overpass response to POIs (exported for bulk downloads)
export function parseOverpassResponse(response: OverpassResponse): POI[] {
  const pois: POI[] = [];

  for (const element of response.elements) {
    const tags = element.tags || {};
    const category = getCategoryFromTags(tags);
    if (!category) continue;

    // Get coordinates (node has lat/lon, way has center)
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    // Strip unnecessary tags - keep only essential ones for memory efficiency
    const essentialTags: Record<string, string> = {};
    for (const key of ESSENTIAL_TAGS) {
      if (tags[key]) essentialTags[key] = tags[key];
    }

    pois.push({
      id: `${element.type}/${element.id}`,
      type: element.type,
      category,
      name: tags.name || null,
      latitude: lat,
      longitude: lon,
      tags: essentialTags,
    });
  }

  return pois;
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch POIs for a bounding box
// IMPORTANT: Only fetches explicitly selected categories - returns empty if none provided
export async function fetchPOIs(
  bbox: BoundingBox,
  categories?: POICategory[],
  signal?: AbortSignal  // Optional abort signal for per-tile timeout
): Promise<POI[]> {
  // Return empty if no categories explicitly provided
  if (!categories || categories.length === 0) {
    return [];
  }

  // Check if already aborted
  if (signal?.aborted) {
    return [];
  }

  await waitForRateLimit();

  const categoriesToFetch = POI_CATEGORIES.filter((c) => categories.includes(c.id));

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
      signal  // Pass through external signal
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
      // Log abort separately for debugging timeout issues
      logger.warn('poi', 'POI fetch aborted (timeout or cancelled)');
    } else {
      logger.warn('api', 'POI fetch failed', error);
    }
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

  // Use shared getBoundingBox utility
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

// Add distance from user to POIs
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
  const bboxKey = getBboxKey(bbox, categories);

  // Check if request for this area is already pending (deduplication)
  const pendingRequest = pendingRequests.get(bboxKey);
  if (pendingRequest) {
    // Same bbox + categories = exact match, return as-is (already filtered by query)
    return pendingRequest;
  }

  // Create new request promise
  const requestPromise = (async (): Promise<POI[]> => {
    try {
      // Check if this area is already cached
      const isCached = await poiRepository.isTileCached(bbox);

      if (isCached) {
        // Return from cache - filter by categories since cache stores all POIs
        const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
        if (categories && categories.length > 0) {
          return cachedPOIs.filter((poi) => categories.includes(poi.category));
        }
        return cachedPOIs;
      }

      // Not cached - fetch from Overpass API (already filtered by query)
      const freshPOIs = await fetchPOIs(bbox, categories);

      // Save to cache (async, don't block return)
      if (freshPOIs.length > 0) {
        poiRepository.savePOIs(freshPOIs, bbox).catch((error) => {
          logger.warn('cache', 'Failed to cache POIs', error);
        });
      }

      return freshPOIs;
    } catch (error) {
      logger.warn('api', 'fetchPOIsWithCache error', error);
      // Fallback to direct API call
      return fetchPOIs(bbox, categories);
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(bboxKey);
    }
  })();

  // Track the pending request
  pendingRequests.set(bboxKey, requestPromise);

  return requestPromise;
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

    // 3. Fetch fresh data in background (already filtered by query)
    const freshPOIs = await fetchPOIs(bbox, categories);

    // 4. Save to cache
    if (freshPOIs.length > 0) {
      await poiRepository.savePOIs(freshPOIs, bbox);
    }

    // 5. Notify with fresh data (no need to filter - fetchPOIs already did)
    onFreshData(freshPOIs);
  } catch (error) {
    logger.warn('api', 'fetchPOIsProgressively error', error);
  }
}

/**
 * Fetch POIs for only the uncached tiles in a viewport
 * This is more efficient than fetching the entire bounding box
 *
 * IMPORTANT: Downloaded POIs are ALWAYS included regardless of category filters.
 * This ensures users can see their offline POIs even if they change filter settings.
 */
export async function fetchPOIsForViewport(
  bbox: BoundingBox,
  categories?: POICategory[],
  showPOIs: boolean = true,  // Controls whether to fetch API POIs (downloaded always fetched)
  onProgress?: (loaded: number, total: number) => void,
  onChunkComplete?: (pois: POI[]) => void  // NEW: Show POIs as they load
): Promise<POI[]> {
  const startTime = Date.now();
  logger.info('poi', 'fetchPOIsForViewport START', { bbox, categories, showPOIs });

  const allPOIs: POI[] = [];

  // ALWAYS get downloaded POIs first - they bypass category filters
  // Downloaded POIs should always be visible to the user
  const downloadedPOIs = await poiRepository.getDownloadedPOIsInBounds(bbox);
  logger.info('poi', '[DIAGNOSTIC] Downloaded POIs retrieved', {
    count: downloadedPOIs.length,
    sample: downloadedPOIs.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      isDownloaded: p.isDownloaded,
      lat: p.latitude,
      lon: p.longitude,
    })),
    bbox,
  });
  if (downloadedPOIs.length > 0) {
    logger.info('poi', 'Downloaded POIs found (always visible)', {
      count: downloadedPOIs.length,
      elapsed: Date.now() - startTime,
    });
    allPOIs.push(...downloadedPOIs);
  }

  // If showPOIs is false, return ONLY downloaded POIs (skip API fetching)
  // Downloaded POIs are always visible since user explicitly downloaded them
  if (!showPOIs) {
    logger.info('poi', 'showPOIs is false - returning downloaded POIs only', {
      count: allPOIs.length,
      elapsed: Date.now() - startTime,
    });
    return allPOIs;
  }

  // Get uncached tiles
  const uncachedTiles = await poiRepository.getUncachedTiles(bbox);
  logger.info('poi', 'Tiles check complete', {
    uncachedTiles: uncachedTiles.length,
    elapsed: Date.now() - startTime,
  });

  // OPTIMIZATION: If too many tiles needed, skip API and return cached/downloaded only
  // This prevents slow/hung requests when zoomed out too far
  const MAX_TILES = 20;
  if (uncachedTiles.length > MAX_TILES) {
    logger.warn('poi', 'Too many tiles - returning cached/downloaded only (zoom in for more)', {
      tilesNeeded: uncachedTiles.length,
      maxAllowed: MAX_TILES,
    });
    const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
    // Filter cached by category, but downloaded (already added) are unfiltered
    if (categories && categories.length > 0) {
      const filteredCached = cachedPOIs.filter(poi => categories.includes(poi.category));
      allPOIs.push(...filteredCached);
    } else {
      allPOIs.push(...cachedPOIs);
    }
    // Deduplicate (downloaded takes priority)
    const uniquePOIs = new Map<string, POI>();
    for (const poi of allPOIs) {
      uniquePOIs.set(poi.id, poi);
    }
    return Array.from(uniquePOIs.values());
  }

  // If all tiles are cached, return from cache
  if (uncachedTiles.length === 0) {
    logger.info('poi', 'All tiles CACHED - fetching from DB');
    const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
    logger.info('poi', 'Cached POIs returned', {
      count: cachedPOIs.length,
      elapsed: Date.now() - startTime,
    });
    // Filter cached by category, but downloaded (already added) are unfiltered
    if (categories && categories.length > 0) {
      const filteredCached = cachedPOIs.filter(poi => categories.includes(poi.category));
      allPOIs.push(...filteredCached);
    } else {
      allPOIs.push(...cachedPOIs);
    }
    // Deduplicate (downloaded takes priority)
    const uniquePOIs = new Map<string, POI>();
    for (const poi of allPOIs) {
      uniquePOIs.set(poi.id, poi);
    }
    logger.info('poi', 'Final POIs after dedup', {
      total: uniquePOIs.size,
      downloaded: downloadedPOIs.length,
      elapsed: Date.now() - startTime,
    });
    return Array.from(uniquePOIs.values());
  }

  // Get cached POIs (filter by category)
  logger.info('poi', 'Getting cached POIs for partial coverage');
  const cachedPOIs = await poiRepository.getPOIsInBounds(bbox);
  if (categories && categories.length > 0) {
    allPOIs.push(...cachedPOIs.filter(poi => categories.includes(poi.category)));
  } else {
    allPOIs.push(...cachedPOIs);
  }
  logger.info('poi', 'Cached POIs retrieved', {
    count: allPOIs.length,
    elapsed: Date.now() - startTime,
  });

  // Per-tile timeout: skip slow tiles instead of waiting forever
  const TILE_TIMEOUT_MS = 8000;  // 8 seconds max per tile (increased from 4s for slow Overpass servers)
  const CONCURRENCY = 3;  // Safe with per-tile timeouts
  let loaded = 0;

  // Split tiles into chunks for parallel processing
  const chunks: BoundingBox[][] = [];
  for (let i = 0; i < uncachedTiles.length; i += CONCURRENCY) {
    chunks.push(uncachedTiles.slice(i, i + CONCURRENCY));
  }
  logger.info('poi', 'Starting API fetches', {
    totalTiles: uncachedTiles.length,
    chunks: chunks.length,
    concurrency: CONCURRENCY,
    tileTimeout: TILE_TIMEOUT_MS,
  });

  let chunkIndex = 0;
  for (const chunk of chunks) {
    chunkIndex++;
    logger.info('poi', `Fetching chunk ${chunkIndex}/${chunks.length}`, {
      tilesInChunk: chunk.length,
      elapsed: Date.now() - startTime,
    });

    // Fetch tiles in this chunk in parallel WITH per-tile timeout
    const results = await Promise.all(
      chunk.map(async (tile) => {
        const tileController = new AbortController();
        const tileTimeout = setTimeout(() => tileController.abort(), TILE_TIMEOUT_MS);

        try {
          const freshPOIs = await fetchPOIs(tile, categories, tileController.signal);

          // Always mark tile as cached (prevents refetch loop for empty regions)
          poiRepository.markTileAsCached(tile).catch((error) => {
            logger.warn('cache', 'Failed to mark tile as cached', error);
          });

          // Save POIs if any were found
          if (freshPOIs.length > 0) {
            poiRepository.savePOIs(freshPOIs, tile).catch((error) => {
              logger.warn('cache', 'Failed to cache tile POIs', error);
            });
          }

          return freshPOIs;
        } catch (error: unknown) {
          // Log timeout separately from other errors
          if (isAbortError(error)) {
            logger.warn('poi', 'Tile timeout - skipping slow region', {
              tile: `${tile.south.toFixed(2)},${tile.west.toFixed(2)}`,
            });
            // Mark timed out tiles as cached with short duration to prevent immediate refetch
            poiRepository.markTileAsCached(tile).catch(() => {});
          } else {
            logger.warn('api', 'Failed to fetch tile', error);
          }
          return [];
        } finally {
          clearTimeout(tileTimeout);
        }
      })
    );

    const chunkPOIsList = results.flat();
    logger.info('poi', `Chunk ${chunkIndex} complete`, {
      poisFetched: chunkPOIsList.length,
      elapsed: Date.now() - startTime,
    });

    // Add all results from this chunk
    allPOIs.push(...chunkPOIsList);

    // PROGRESSIVE DISPLAY: Show POIs immediately as each chunk completes
    if (chunkPOIsList.length > 0) {
      onChunkComplete?.(chunkPOIsList);
    }

    loaded += chunk.length;
    onProgress?.(loaded, uncachedTiles.length);
  }

  // Deduplicate POIs by ID (in case of overlap)
  // All POIs are already filtered - cached filtered when added, fresh filtered by query
  const uniquePOIs = new Map<string, POI>();
  for (const poi of allPOIs) {
    uniquePOIs.set(poi.id, poi);
  }

  logger.info('poi', 'fetchPOIsForViewport COMPLETE', {
    totalPOIs: uniquePOIs.size,
    beforeDedup: allPOIs.length,
    totalTime: Date.now() - startTime,
  });

  return Array.from(uniquePOIs.values());
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

  // Use shared getBoundingBox utility
  const bounds = getBoundingBox(routePoints, corridorKm);
  if (!bounds) return [];

  const bbox: BoundingBox = {
    south: bounds.south,
    north: bounds.north,
    west: bounds.west,
    east: bounds.east,
  };

  return fetchPOIsWithCache(bbox, categories);
}

/**
 * Fetch POIs near user's position on a route
 * Only fetches POIs for a segment ahead of the user, not the entire route
 *
 * @param routePoints Full route coordinates
 * @param userLat User's current latitude
 * @param userLon User's current longitude
 * @param distanceAheadKm How far ahead on the route to load POIs (default 50km)
 * @param corridorKm Width of corridor around route (default 10km)
 * @param categories POI categories to fetch (if undefined, fetches none)
 * @returns POIs within the corridor of the route segment ahead
 */
export async function fetchPOIsNearPositionOnRoute(
  routePoints: Array<{ latitude: number; longitude: number }>,
  userLat: number,
  userLon: number,
  distanceAheadKm: number = 50,
  corridorKm: number = 10,
  categories?: POICategory[]
): Promise<POI[]> {
  // Don't fetch if no categories selected
  if (!categories || categories.length === 0) {
    logger.info('api', 'No POI categories selected, skipping fetch');
    return [];
  }

  if (routePoints.length === 0) {
    return [];
  }

  // Find the nearest point on route to user's position
  const { index: nearestIndex } = findNearestPointOnRoute(
    routePoints,
    userLat,
    userLon
  );

  // Get route segment ahead of user's position
  const segmentAhead = getRouteSegmentAhead(routePoints, nearestIndex, distanceAheadKm);

  if (segmentAhead.length === 0) {
    return [];
  }

  // Calculate bounding box for the segment with corridor buffer
  const bbox = getBoundingBox(segmentAhead, corridorKm);

  if (!bbox) {
    return [];
  }

  const boundingBox: BoundingBox = {
    south: bbox.south,
    north: bbox.north,
    west: bbox.west,
    east: bbox.east,
  };

  logger.info('api', `Fetching POIs for ${segmentAhead.length} points, ${distanceAheadKm}km ahead`);

  return fetchPOIsWithCache(boundingBox, categories);
}

/**
 * Fetch POIs for a route progressively - segment by segment
 * This is MUCH faster than loading the entire route at once
 *
 * @param routePoints Full route coordinates
 * @param corridorKm Width of corridor around route (default 10km)
 * @param categories POI categories to fetch
 * @param onSegmentLoaded Called when POIs for a segment are loaded
 * @param onProgress Called with (loaded, total) segment counts
 */
export async function fetchPOIsForRouteProgressively(
  routePoints: Array<{ latitude: number; longitude: number }>,
  corridorKm: number = 10,
  categories: POICategory[],
  onSegmentLoaded: (pois: POI[], segmentIndex: number) => void,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (!categories || categories.length === 0) {
    logger.info('api', 'No POI categories selected, skipping fetch');
    return;
  }

  if (routePoints.length === 0) {
    return;
  }

  // Split route into 50km segments
  const segments = splitRouteIntoSegments(routePoints, 50);
  const totalSegments = segments.length;

  logger.info('api', `Loading POIs for ${totalSegments} segments along route`);

  // Single-pass loading: check cache AND fetch fresh in one pass
  // Process segments in chunks of 3 for parallel fetching
  const CONCURRENCY = 3;
  let loadedCount = 0;

  for (let chunkStart = 0; chunkStart < segments.length; chunkStart += CONCURRENCY) {
    const chunk = segments.slice(chunkStart, chunkStart + CONCURRENCY);

    // Process all segments in this chunk in parallel
    await Promise.all(
      chunk.map(async (segment, chunkIndex) => {
        const segmentIndex = chunkStart + chunkIndex;
        const bbox = getBoundingBox(segment, corridorKm);
        if (!bbox) return;

        const boundingBox: BoundingBox = {
          south: bbox.south,
          north: bbox.north,
          west: bbox.west,
          east: bbox.east,
        };

        try {
          // Check cache first - show cached POIs immediately if available
          const cachedPOIs = await poiRepository.getPOIsInBounds(boundingBox);
          if (cachedPOIs.length > 0) {
            const filteredCached = cachedPOIs.filter((poi) =>
              categories.includes(poi.category)
            );
            if (filteredCached.length > 0) {
              onSegmentLoaded(filteredCached, segmentIndex);
            }
          }

          // Check if cache is fresh - if so, we're done with this segment
          const isCached = await poiRepository.isTileCached(boundingBox);
          if (isCached) {
            loadedCount++;
            onProgress?.(loadedCount, totalSegments);
            return;
          }

          // Cache is stale or missing - fetch fresh data
          const freshPOIs = await fetchPOIs(boundingBox, categories);

          // Cache the results (async, don't block)
          if (freshPOIs.length > 0) {
            poiRepository.savePOIs(freshPOIs, boundingBox).catch((error) => {
              logger.warn('cache', 'Failed to cache segment POIs', error);
            });
          }

          // Notify with fresh POIs (no need to filter - fetchPOIs already did)
          onSegmentLoaded(freshPOIs, segmentIndex);
          loadedCount++;
          onProgress?.(loadedCount, totalSegments);
        } catch (error: unknown) {
          if (!isAbortError(error)) {
            logger.warn('api', `Failed to fetch segment ${segmentIndex}`, error);
          }
          loadedCount++;
          onProgress?.(loadedCount, totalSegments);
        }
      })
    );
  }

  logger.info('api', `Finished loading POIs for all ${totalSegments} segments`);
}
