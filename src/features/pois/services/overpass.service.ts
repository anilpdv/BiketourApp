import { POI, POICategory, POICategoryConfig, BoundingBox, OverpassResponse } from '../types';
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

// Wait for rate limit
async function waitForRateLimit(): Promise<void> {
  await rateLimiter.waitForRateLimit();
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch POIs for a bounding box
// When no categories specified, fetches ALL categories (show all POIs by default)
export async function fetchPOIs(
  bbox: BoundingBox,
  categories?: POICategory[],
  signal?: AbortSignal  // Optional abort signal for per-tile timeout
): Promise<POI[]> {
  // Check if already aborted
  if (signal?.aborted) {
    return [];
  }

  await waitForRateLimit();

  // If no categories specified, fetch ALL categories (show all POIs by default)
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

      // Save to cache with categories tracking (async, don't block return)
      if (freshPOIs.length > 0) {
        poiRepository.savePOIs(freshPOIs, bbox, categories).catch((error) => {
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

    // 4. Save to cache with categories tracking
    if (freshPOIs.length > 0) {
      await poiRepository.savePOIs(freshPOIs, bbox, categories);
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
  if (downloadedPOIs.length > 0) {
    logger.info('poi', 'Downloaded POIs found (always visible)', {
      count: downloadedPOIs.length,
      elapsed: Date.now() - startTime,
    });
    // Use loop instead of spread to avoid stack overflow with large arrays (466K+ POIs)
    for (const poi of downloadedPOIs) {
      allPOIs.push(poi);
    }
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

  // Get uncached tiles (now category-aware - tiles missing requested categories are considered uncached)
  const uncachedTiles = await poiRepository.getUncachedTiles(bbox, categories);
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
    // Use loop instead of spread to avoid stack overflow with large arrays
    if (categories && categories.length > 0) {
      const filteredCached = cachedPOIs.filter(poi => categories.includes(poi.category));
      for (const poi of filteredCached) {
        allPOIs.push(poi);
      }
    } else {
      for (const poi of cachedPOIs) {
        allPOIs.push(poi);
      }
    }
    // Deduplicate - downloaded POIs always take priority
    const uniquePOIs = new Map<string, POI>();
    for (const poi of allPOIs) {
      const existing = uniquePOIs.get(poi.id);
      // Downloaded POIs always win in deduplication
      if (!existing || poi.isDownloaded) {
        uniquePOIs.set(poi.id, poi);
      }
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
    // Use loop instead of spread to avoid stack overflow with large arrays
    if (categories && categories.length > 0) {
      const filteredCached = cachedPOIs.filter(poi => categories.includes(poi.category));
      for (const poi of filteredCached) {
        allPOIs.push(poi);
      }
    } else {
      for (const poi of cachedPOIs) {
        allPOIs.push(poi);
      }
    }
    // Deduplicate - downloaded POIs always take priority
    const uniquePOIs = new Map<string, POI>();
    for (const poi of allPOIs) {
      const existing = uniquePOIs.get(poi.id);
      // Downloaded POIs always win in deduplication
      if (!existing || poi.isDownloaded) {
        uniquePOIs.set(poi.id, poi);
      }
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
  // Use loop instead of spread to avoid stack overflow with large arrays
  if (categories && categories.length > 0) {
    const filteredCached = cachedPOIs.filter(poi => categories.includes(poi.category));
    for (const poi of filteredCached) {
      allPOIs.push(poi);
    }
  } else {
    for (const poi of cachedPOIs) {
      allPOIs.push(poi);
    }
  }
  logger.info('poi', 'Cached POIs retrieved', {
    count: allPOIs.length,
    elapsed: Date.now() - startTime,
  });

  // Per-tile timeout: skip slow tiles instead of waiting forever
  const TILE_TIMEOUT_MS = 15000;  // 15 seconds max per tile (match Overpass query timeout)
  const CONCURRENCY = 6;  // Higher concurrency for faster loading
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

          // Always mark tile as cached with categories (prevents refetch loop for empty regions)
          poiRepository.markTileAsCached(tile, categories).catch((error) => {
            logger.warn('cache', 'Failed to mark tile as cached', error);
          });

          // Save POIs if any were found (with categories tracking)
          if (freshPOIs.length > 0) {
            poiRepository.savePOIs(freshPOIs, tile, categories).catch((error) => {
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
            // Mark timed out tiles as cached with categories to prevent immediate refetch
            poiRepository.markTileAsCached(tile, categories).catch(() => {});
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

    // Add all results from this chunk (use loop for consistency with large array handling)
    for (const poi of chunkPOIsList) {
      allPOIs.push(poi);
    }

    // PROGRESSIVE DISPLAY: Show POIs immediately as each chunk completes
    if (chunkPOIsList.length > 0) {
      onChunkComplete?.(chunkPOIsList);
    }

    loaded += chunk.length;
    onProgress?.(loaded, uncachedTiles.length);
  }

  // Deduplicate POIs by ID (in case of overlap)
  // All POIs are already filtered - cached filtered when added, fresh filtered by query
  // Downloaded POIs always take priority to preserve isDownloaded flag
  const uniquePOIs = new Map<string, POI>();
  for (const poi of allPOIs) {
    const existing = uniquePOIs.get(poi.id);
    // Downloaded POIs always win in deduplication
    if (!existing || poi.isDownloaded) {
      uniquePOIs.set(poi.id, poi);
    }
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

          // Cache the results with categories tracking (async, don't block)
          if (freshPOIs.length > 0) {
            poiRepository.savePOIs(freshPOIs, boundingBox, categories).catch((error) => {
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
