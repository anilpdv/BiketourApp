/**
 * Tile Download Service
 * Handles downloading map tiles for offline use
 */

import { BoundingBox } from '../../pois/types';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';
import { logger } from '../../../shared/utils';
import {
  TileCoordinate,
  TileDownloadProgress,
  TileDownloadOptions,
  TileDownloadResult,
  DEFAULT_MIN_ZOOM,
  DEFAULT_MAX_ZOOM,
} from '../types/tiles';
import {
  isTileCached,
  saveTileFromUrl,
} from './tileCache.service';
import { generateRegionName, generateRegionId } from './downloadBounds.service';

/**
 * Maximum concurrent tile downloads
 */
const MAX_CONCURRENT_DOWNLOADS = 8;

/**
 * Convert latitude/longitude to tile coordinates at a given zoom level
 * Uses Web Mercator projection (EPSG:3857)
 */
export function latLonToTile(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * Convert tile coordinates back to latitude/longitude (northwest corner of tile)
 */
export function tileToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const n = Math.pow(2, z);
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lon };
}

/**
 * Get all tile coordinates covering a bounding box at a specific zoom level
 */
export function getTilesInBounds(bounds: BoundingBox, zoom: number): TileCoordinate[] {
  const { south, west, north, east } = bounds;

  // Get tile coordinates for corners (note: y increases southward)
  const nwTile = latLonToTile(north, west, zoom);
  const seTile = latLonToTile(south, east, zoom);

  const minX = nwTile.x;
  const maxX = seTile.x;
  const minY = nwTile.y;
  const maxY = seTile.y;

  const tiles: TileCoordinate[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  return tiles;
}

/**
 * Get all tiles for a bounding box across multiple zoom levels
 */
export function getAllTilesForBounds(
  bounds: BoundingBox,
  minZoom: number = DEFAULT_MIN_ZOOM,
  maxZoom: number = DEFAULT_MAX_ZOOM
): TileCoordinate[] {
  const allTiles: TileCoordinate[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    allTiles.push(...getTilesInBounds(bounds, z));
  }

  return allTiles;
}

/**
 * Get the URL for a tile based on style
 */
export function getTileUrl(styleKey: MapStyleKey, x: number, y: number, z: number): string {
  switch (styleKey) {
    case 'cyclosm': {
      // CyclOSM uses multiple servers for load balancing
      const servers = ['a', 'b', 'c'];
      const server = servers[Math.floor(Math.random() * servers.length)];
      return `https://${server}.tile-cyclosm.openstreetmap.fr/cyclosm/${z}/${x}/${y}.png`;
    }

    case 'satellite':
      // ESRI World Imagery - note: uses {z}/{y}/{x} format
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

    case 'topo':
      // ESRI Topographic
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;

    case 'terrain':
      // ESRI Hillshade
      return `https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;

    case 'natgeo':
      // National Geographic World Map
      return `https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/${z}/${y}/${x}`;

    default:
      throw new Error(`Unsupported style for raster tile download: ${styleKey}`);
  }
}

/**
 * Check if a style supports raster tile downloading
 */
export function isRasterStyle(styleKey: MapStyleKey): boolean {
  return ['cyclosm', 'satellite', 'topo', 'terrain', 'natgeo'].includes(styleKey);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download a single tile with retry logic
 * @returns Size of downloaded tile in bytes, or 0 if skipped/failed
 */
async function downloadTileWithRetry(
  styleKey: MapStyleKey,
  tile: TileCoordinate,
  abortSignal?: AbortSignal,
  maxRetries: number = 3
): Promise<{ success: boolean; size: number; skipped: boolean }> {
  // Check if already cached
  const cached = await isTileCached(styleKey, tile.z, tile.x, tile.y);
  if (cached) {
    return { success: true, size: 0, skipped: true };
  }

  const url = getTileUrl(styleKey, tile.x, tile.y, tile.z);
  const retryDelays = [500, 1000, 2000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (abortSignal?.aborted) {
      return { success: false, size: 0, skipped: false };
    }

    try {
      const size = await saveTileFromUrl(styleKey, tile.z, tile.x, tile.y, url);
      return { success: true, size, skipped: false };
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt] || 2000;
        await sleep(delay);
        continue;
      }

      logger.warn('offline', 'Tile download failed after retries', {
        tile,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { success: false, size: 0, skipped: false };
    }
  }

  return { success: false, size: 0, skipped: false };
}

/**
 * Download all tiles for a region
 */
export async function downloadTilesForRegion(
  options: TileDownloadOptions
): Promise<TileDownloadResult> {
  const {
    bounds,
    styleKey,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    regionName,
    onProgress,
    abortSignal,
  } = options;

  // Validate style supports raster download
  if (!isRasterStyle(styleKey)) {
    throw new Error(`Style ${styleKey} is not a raster style and cannot be downloaded this way`);
  }

  const regionId = generateRegionId();
  const finalRegionName =
    regionName || generateRegionName((bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2);

  logger.info('offline', 'Starting tile download', {
    regionId,
    styleKey,
    bounds,
    zoomRange: `${minZoom}-${maxZoom}`,
  });

  // Calculate all tiles needed
  const allTiles = getAllTilesForBounds(bounds, minZoom, maxZoom);
  const totalTiles = allTiles.length;

  logger.info('offline', `Downloading ${totalTiles} tiles for style: ${styleKey}`);

  // Progress reporting
  const reportProgress = (progress: Partial<TileDownloadProgress>) => {
    onProgress?.({
      phase: 'downloading',
      currentTile: 0,
      totalTiles,
      percentage: 0,
      currentZoom: minZoom,
      failedTiles: 0,
      bytesDownloaded: 0,
      ...progress,
    });
  };

  reportProgress({
    phase: 'preparing',
    percentage: 2,
    message: `Preparing to download ${totalTiles} tiles...`,
  });

  // Check for abort
  if (abortSignal?.aborted) {
    reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
    throw new Error('Download cancelled');
  }

  let downloadedTiles = 0;
  let skippedTiles = 0;
  let failedTiles = 0;
  let bytesDownloaded = 0;

  // Process tiles in batches for controlled concurrency
  for (let i = 0; i < allTiles.length; i += MAX_CONCURRENT_DOWNLOADS) {
    // Check for abort
    if (abortSignal?.aborted) {
      reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
      throw new Error('Download cancelled');
    }

    const batch = allTiles.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
    const currentZoom = batch[0]?.z || minZoom;

    // Report progress before batch
    reportProgress({
      phase: 'downloading',
      currentTile: downloadedTiles + skippedTiles,
      percentage: Math.round(((downloadedTiles + skippedTiles) / totalTiles) * 100),
      currentZoom,
      failedTiles,
      bytesDownloaded,
      message: `Downloading tiles (zoom ${currentZoom})...`,
    });

    // Download batch in parallel
    const results = await Promise.all(
      batch.map((tile) => downloadTileWithRetry(styleKey, tile, abortSignal))
    );

    // Process results
    for (const result of results) {
      if (result.skipped) {
        skippedTiles++;
      } else if (result.success) {
        downloadedTiles++;
        bytesDownloaded += result.size;
      } else {
        failedTiles++;
      }
    }

    // Report progress after batch
    const processed = downloadedTiles + skippedTiles + failedTiles;
    reportProgress({
      phase: 'downloading',
      currentTile: processed,
      percentage: Math.round((processed / totalTiles) * 100),
      currentZoom,
      failedTiles,
      bytesDownloaded,
      message: `Downloaded ${downloadedTiles} tiles (${skippedTiles} cached, ${failedTiles} failed)`,
    });
  }

  // Check for abort before completing
  if (abortSignal?.aborted) {
    reportProgress({ phase: 'cancelled', message: 'Download cancelled' });
    throw new Error('Download cancelled');
  }

  // Complete
  reportProgress({
    phase: 'complete',
    currentTile: totalTiles,
    percentage: 100,
    currentZoom: maxZoom,
    failedTiles,
    bytesDownloaded,
    message: `Downloaded ${downloadedTiles} tiles (${bytesDownloaded} bytes)`,
  });

  logger.info('offline', 'Tile download complete', {
    regionId,
    downloadedTiles,
    skippedTiles,
    failedTiles,
    bytesDownloaded,
  });

  return {
    regionId,
    regionName: finalRegionName,
    styleKey,
    tileCount: downloadedTiles + skippedTiles,
    sizeBytes: bytesDownloaded,
    failedTiles,
  };
}

/**
 * Calculate tile bounds for a region (for storage/deletion)
 */
export function calculateTileBoundsForRegion(
  bounds: BoundingBox,
  minZoom: number,
  maxZoom: number
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  // Use the highest zoom level for the most precise bounds
  const nwTile = latLonToTile(bounds.north, bounds.west, minZoom);
  const seTile = latLonToTile(bounds.south, bounds.east, minZoom);

  return {
    minX: nwTile.x,
    maxX: seTile.x,
    minY: nwTile.y,
    maxY: seTile.y,
  };
}
