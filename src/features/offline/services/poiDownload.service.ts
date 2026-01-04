/**
 * POI Download Service
 * Handles downloading POIs for offline use
 * Uses WatermelonDB for high-performance native thread operations
 */

import { POI, POICategory, BoundingBox, OverpassResponse } from '../../pois/types';
import {
  POI_CATEGORIES,
  buildMultiCategoryQuery,
  parseOverpassResponse,
} from '../../pois/services/overpass.service';
import { poiRepositoryWM } from '../../pois/services/poi.repository.watermelon';
import { logger } from '../../../shared/utils';
import { fetchWithTimeout } from '../../../shared/api/httpClient';
import { API_CONFIG } from '../../../shared/config';

// Import from extracted modules
import {
  calculateBoundsFromRadius,
  getTilesCoveringBounds,
  getTilesCoveringBoundsForDownload,
  shouldUseSingleQueryMode,
  getRegionSizeKm,
  generateRegionName,
  generateRegionId,
  BULK_DOWNLOAD_TILE_SIZE,
} from './downloadBounds.service';
import {
  estimateDownload,
  estimateDownloadForBounds,
  DownloadEstimate,
} from './downloadEstimation.service';

// Re-export for backwards compatibility
export {
  calculateBoundsFromRadius,
  getTilesCoveringBounds,
  getTilesCoveringBoundsForDownload,
  generateRegionName,
  generateRegionId,
} from './downloadBounds.service';
export {
  estimateDownload,
  estimateDownloadForBounds,
  DownloadEstimate,
} from './downloadEstimation.service';

// Maximum concurrent tile downloads
// kumi.systems has no rate limits - can handle more parallelism
const MAX_CONCURRENT_DOWNLOADS = 8;

// Delay between API requests to respect rate limits (ms)
// Set to 0 since the rate limiter handles throttling
const REQUEST_DELAY_MS = 0;

// Database row interfaces removed - now using WatermelonDB models

export interface DownloadOptions {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  categories: POICategory[];
  regionName?: string;
  boundingBox?: BoundingBox; // Optional: use this instead of calculating from radius
  onProgress?: (progress: DownloadProgress) => void;
  abortSignal?: AbortSignal;
}

export interface DownloadProgress {
  phase: 'estimating' | 'downloading' | 'saving' | 'complete' | 'cancelled' | 'error';
  currentPOIs: number;
  totalPOIs: number;
  percentage: number;
  currentTile: number;
  totalTiles: number;
  failedTiles: number; // Count of tiles that failed to download
  message?: string;
}

export interface DownloadResult {
  regionId: string;
  regionName: string;
  poiCount: number;
  sizeBytes: number;
  categories: POICategory[];
}

export interface DownloadedRegion {
  id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  bounds: BoundingBox;
  // Expose individual bounds for convenience
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  poiCount: number;
  sizeBytes: number;
  downloadedAt: Date;
  categories: POICategory[];
}

// DownloadEstimate is re-exported from downloadEstimation.service.ts

// Retry configuration for download resilience
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/**
 * Fetch POIs for a tile with retry logic and exponential backoff
 * This bypasses the shared rate limiter for faster parallel fetches
 */
async function fetchPOIsForTileBulk(
  bbox: BoundingBox,
  categories: POICategory[],
  signal?: AbortSignal
): Promise<POI[]> {
  const categoriesToFetch = POI_CATEGORIES.filter((c) => categories.includes(c.id));
  if (categoriesToFetch.length === 0) return [];

  const query = buildMultiCategoryQuery(bbox, categoriesToFetch);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Check for abort before each attempt
    if (signal?.aborted) {
      return [];
    }

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
        30000, // 30s timeout for large tiles
        signal
      );

      if (response.ok) {
        const data: OverpassResponse = await response.json();
        return parseOverpassResponse(data);
      }

      // Retry on server error (500+)
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 4000;
        await sleep(delay);
        continue;
      }

      // Retry on rate limit (429) with longer delay
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = (RETRY_DELAYS[attempt] || 4000) * 2;
        logger.info('offline', `Rate limited, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Non-retryable error
      return [];
    } catch (error) {
      // AbortError - don't retry, just return empty
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }

      // Network error - retry with backoff
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 4000;
        logger.info('offline', `Tile fetch attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // All retries exhausted
      logger.warn('offline', 'Bulk tile fetch failed after retries', error);
      return [];
    }
  }

  return [];
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// generateRegionName, estimateDownload, estimateDownloadForBounds
// are re-exported from extracted modules above

/**
 * Download POIs for an area
 */
export async function downloadPOIsForArea(
  options: DownloadOptions
): Promise<DownloadResult> {
  const {
    centerLat,
    centerLon,
    radiusKm,
    categories,
    regionName,
    boundingBox,
    onProgress,
    abortSignal,
  } = options;

  const regionId = generateRegionId();
  const finalRegionName = regionName || generateRegionName(centerLat, centerLon);

  logger.info('offline', 'Starting POI download', {
    regionId,
    center: `${centerLat}, ${centerLon}`,
    radiusKm,
    categories: categories.length,
    usingBoundingBox: !!boundingBox,
  });

  // Use provided bounding box or calculate from radius
  const bounds = boundingBox || calculateBoundsFromRadius(centerLat, centerLon, radiusKm);

  // Check if region is small enough for single-query mode (FAST!)
  const useSingleQuery = shouldUseSingleQueryMode(bounds);
  const regionSize = getRegionSizeKm(bounds);

  // For single query, we treat it as 1 tile; otherwise use tile-based
  const tiles = useSingleQuery ? [bounds] : getTilesCoveringBoundsForDownload(bounds);
  const totalTiles = tiles.length;

  logger.info('offline', `Downloading POIs`, {
    mode: useSingleQuery ? 'SINGLE_QUERY (fast)' : `TILE_BASED (${totalTiles} tiles)`,
    regionSize: `${regionSize.widthKm}km x ${regionSize.heightKm}km`,
  });

  // Track failed tiles for user feedback
  let failedTileCount = 0;

  // Progress reporting
  const reportProgress = (progress: Partial<DownloadProgress>) => {
    onProgress?.({
      phase: 'downloading',
      currentPOIs: 0,
      totalPOIs: 0,
      percentage: 0,
      currentTile: 0,
      totalTiles,
      failedTiles: failedTileCount,
      ...progress,
    });
  };

  reportProgress({ phase: 'estimating', message: useSingleQuery ? 'Fetching POIs...' : 'Calculating download size...' });

  // Check for abort
  if (abortSignal?.aborted) {
    reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
    throw new Error('Download cancelled');
  }

  // Download POIs
  const allPOIs: POI[] = [];
  let tilesProcessed = 0;

  // Track saved POI IDs to avoid "pending changes" conflicts from duplicates
  // (POIs at tile boundaries can appear in multiple tiles)
  const savedPoiIds = new Set<string>();

  // Process tiles in chunks for controlled concurrency
  for (let i = 0; i < tiles.length; i += MAX_CONCURRENT_DOWNLOADS) {
    // Check for abort
    if (abortSignal?.aborted) {
      reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
      throw new Error('Download cancelled');
    }

    const chunk = tiles.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
    const chunkIndex = Math.floor(i / MAX_CONCURRENT_DOWNLOADS);
    const totalChunks = Math.ceil(tiles.length / MAX_CONCURRENT_DOWNLOADS);

    // Progress: Connecting (show activity before network call)
    const baseProgress = 5 + Math.round((chunkIndex / totalChunks) * 40);
    reportProgress({
      phase: 'downloading',
      currentPOIs: allPOIs.length,
      totalPOIs: allPOIs.length,
      percentage: baseProgress,
      currentTile: tilesProcessed,
      totalTiles,
      message: useSingleQuery ? 'Connecting to server...' : `Fetching tile ${chunkIndex + 1}/${totalChunks}...`,
    });

    // Start simulated progress animation during network fetch
    // This gives smooth progress updates while waiting for the network response
    let simulatedProgress = baseProgress;
    const maxSimulatedProgress = 90;
    const progressInterval = setInterval(() => {
      simulatedProgress = Math.min(simulatedProgress + 1, maxSimulatedProgress);
      reportProgress({
        phase: 'downloading',
        currentPOIs: allPOIs.length,
        totalPOIs: allPOIs.length,
        percentage: simulatedProgress,
        currentTile: tilesProcessed,
        totalTiles,
        message: useSingleQuery ? 'Downloading POI data...' : `Fetching tile ${chunkIndex + 1}/${totalChunks}...`,
      });
    }, 600); // Update every 600ms for slow animation

    // Fetch tiles in parallel (using bulk fetch - no rate limiting)
    let results: POI[][];
    try {
      results = await Promise.all(
        chunk.map(async (tile) => {
          try {
            const pois = await fetchPOIsForTileBulk(tile, categories, abortSignal);
            // If tile returned empty due to non-abort error, count as potential failure
            // (fetchPOIsForTileBulk returns [] on error)
            return pois;
          } catch (error) {
            // Don't log AbortErrors - they're expected when cancelling
            if (error instanceof Error && error.name === 'AbortError') {
              return [];
            }
            failedTileCount++;
            logger.warn('offline', 'Failed to fetch tile (continuing)', error);
            return [];
          }
        })
      );
    } finally {
      // Always stop the animation timer
      clearInterval(progressInterval);
    }

    // Collect POIs from this chunk
    const chunkPOIs: POI[] = [];
    for (const pois of results) {
      chunkPOIs.push(...pois);
      allPOIs.push(...pois);
    }

    // Progress: Downloaded, now saving
    reportProgress({
      phase: 'downloading',
      currentPOIs: allPOIs.length,
      totalPOIs: allPOIs.length,
      percentage: 45 + Math.round((chunkIndex / totalChunks) * 40),
      currentTile: tilesProcessed,
      totalTiles,
      message: `Downloaded ${allPOIs.length} POIs, saving...`,
    });

    // PROGRESSIVE SAVE: Save POIs as they arrive (awaited for reliability)
    // Filter out POIs already saved in previous chunks to avoid "pending changes" conflicts
    const uniqueChunkPOIs = chunkPOIs.filter((p) => !savedPoiIds.has(p.id));
    if (uniqueChunkPOIs.length > 0) {
      try {
        // Mark these POIs as saved before saving (to prevent duplicates in next chunk)
        for (const poi of uniqueChunkPOIs) {
          savedPoiIds.add(poi.id);
        }
        await poiRepositoryWM.saveDownloadedPOIs(uniqueChunkPOIs);
      } catch (error) {
        logger.warn('offline', 'Failed to save chunk POIs', error);
      }
    }

    tilesProcessed += chunk.length;

    // Progress: Chunk complete
    reportProgress({
      phase: 'downloading',
      currentPOIs: allPOIs.length,
      totalPOIs: allPOIs.length,
      percentage: 50 + Math.round((tilesProcessed / totalTiles) * 40),
      currentTile: tilesProcessed,
      totalTiles,
      message: useSingleQuery
        ? `Saved ${allPOIs.length} POIs`
        : `Downloaded ${allPOIs.length} POIs (${tilesProcessed}/${totalTiles} tiles)`,
    });

    // Rate limiting delay between chunks (if multi-tile mode)
    if (!useSingleQuery && i + MAX_CONCURRENT_DOWNLOADS < tiles.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // WatermelonDB handles deduplication via ON CONFLICT - no need to dedup in memory
  const poiCount = allPOIs.length;
  logger.info('offline', `Fetched ${poiCount} POIs (dedup handled by DB)`);

  // Check for abort before saving
  if (abortSignal?.aborted) {
    reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
    throw new Error('Download cancelled');
  }

  reportProgress({
    phase: 'saving',
    currentPOIs: poiCount,
    totalPOIs: poiCount,
    percentage: 95,
    currentTile: totalTiles,
    totalTiles,
    message: 'Finalizing download...',
  });

  // POIs already saved progressively during download - just log summary
  logger.info('offline', `Download complete: ${poiCount} POIs`);

  // Estimate size (500 bytes per POI average)
  const sizeBytes = poiCount * 500;

  // Create region entry
  await poiRepositoryWM.saveDownloadedRegion({
    id: regionId,
    name: finalRegionName,
    centerLat,
    centerLon,
    radiusKm,
    bbox: bounds,
    poiCount,
    sizeBytes,
    categories,
  });

  reportProgress({
    phase: 'complete',
    currentPOIs: poiCount,
    totalPOIs: poiCount,
    percentage: 100,
    currentTile: totalTiles,
    totalTiles,
    message: `Downloaded ${poiCount} POIs`,
  });

  logger.info('offline', 'Download complete', {
    regionId,
    poiCount,
    sizeBytes,
  });

  return {
    regionId,
    regionName: finalRegionName,
    poiCount,
    sizeBytes,
    categories,
  };
}

// savePOIsAsDownloaded and saveDownloadedRegion now use WatermelonDB via poiRepositoryWM

/**
 * Get all downloaded regions
 */
export async function getDownloadedRegions(): Promise<DownloadedRegion[]> {
  const regions = await poiRepositoryWM.getDownloadedRegions();

  return regions.map((region) => ({
    id: region.regionId,
    name: region.name,
    centerLat: region.centerLat,
    centerLon: region.centerLon,
    radiusKm: region.radiusKm,
    bounds: {
      south: region.minLat,
      north: region.maxLat,
      west: region.minLon,
      east: region.maxLon,
    },
    minLat: region.minLat,
    maxLat: region.maxLat,
    minLon: region.minLon,
    maxLon: region.maxLon,
    poiCount: region.poiCount,
    sizeBytes: region.sizeBytes,
    downloadedAt: new Date(region.downloadedAt),
    categories: region.categories as POICategory[],
  }));
}

/**
 * Delete a downloaded region and its POIs
 */
export async function deleteDownloadedRegion(regionId: string): Promise<void> {
  await poiRepositoryWM.deleteDownloadedRegion(regionId);
}

/**
 * Get downloaded POIs within bounds
 */
export async function getDownloadedPOIsInBounds(bounds: BoundingBox): Promise<POI[]> {
  return poiRepositoryWM.getDownloadedPOIsInBounds(bounds);
}

/**
 * Check if a location is covered by any downloaded region
 */
export async function isLocationCoveredByDownload(
  lat: number,
  lon: number
): Promise<boolean> {
  const regions = await poiRepositoryWM.getDownloadedRegions();

  for (const region of regions) {
    if (
      lat >= region.minLat &&
      lat <= region.maxLat &&
      lon >= region.minLon &&
      lon <= region.maxLon
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get download statistics
 */
export async function getDownloadStats(): Promise<{
  totalPOIs: number;
  sizeBytes: number;
  regions: number;
}> {
  const regions = await poiRepositoryWM.getDownloadedRegions();

  let totalPOIs = 0;
  let sizeBytes = 0;

  for (const region of regions) {
    totalPOIs += region.poiCount;
    sizeBytes += region.sizeBytes;
  }

  return {
    totalPOIs,
    sizeBytes,
    regions: regions.length,
  };
}

/**
 * Check if user should be prompted to download (far from existing downloads)
 */
export async function shouldPromptForDownload(
  lat: number,
  lon: number,
  minDistanceKm: number = 20
): Promise<boolean> {
  // Get all downloaded regions
  const regions = await getDownloadedRegions();

  if (regions.length === 0) {
    // No downloads yet, should prompt
    return true;
  }

  // Check distance to nearest region center
  for (const region of regions) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      region.centerLat,
      region.centerLon
    );

    // If within radius + minDistance of any region, don't prompt
    if (distance < region.radiusKm + minDistanceKm) {
      return false;
    }
  }

  // Far from all regions, should prompt
  return true;
}

/**
 * Calculate haversine distance between two points in km
 */
function calculateHaversineDistance(
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

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Debug function to check database content and POI locations
 * Used for diagnostics to verify POIs are stored and show where they are
 */
export async function debugDatabasePOIs() {
  // Get all downloaded POIs from WatermelonDB
  const { Q } = await import('@nozbe/watermelondb');
  const { poisCollection } = await import('../../../shared/database/watermelon/database');

  const downloadedPOIs = await poisCollection
    .query(Q.where('is_downloaded', true))
    .fetch();

  // Group by category
  const categoryGroups: Record<string, { count: number; avgLat: number; avgLon: number }> = {};

  for (const poi of downloadedPOIs) {
    if (!categoryGroups[poi.category]) {
      categoryGroups[poi.category] = { count: 0, avgLat: 0, avgLon: 0 };
    }
    const group = categoryGroups[poi.category];
    group.avgLat = (group.avgLat * group.count + poi.latitude) / (group.count + 1);
    group.avgLon = (group.avgLon * group.count + poi.longitude) / (group.count + 1);
    group.count++;
  }

  const samples = Object.entries(categoryGroups)
    .slice(0, 10)
    .map(([category, data]) => ({
      category,
      count: data.count,
      latitude: Math.round(data.avgLat * 100) / 100,
      longitude: Math.round(data.avgLon * 100) / 100,
    }));

  return {
    total: downloadedPOIs.length,
    samples,
  };
}
