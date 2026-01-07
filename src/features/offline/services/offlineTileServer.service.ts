/**
 * Offline Tile Server Service
 * Builds modified map styles that serve tiles from local cache
 */

import * as FileSystem from 'expo-file-system/legacy';
import { MapStyleKey, MAP_STYLES } from '../../../shared/config/mapStyles.config';
import { BoundingBox } from '../../pois/types';
import { CachedTileRegion, OFFLINE_RASTER_STYLES } from '../types/tiles';
import { getTilePath, isTileCached } from './tileCache.service';
import { logger } from '../../../shared/utils';

/**
 * Base directory for tile storage
 */
const TILES_DIRECTORY = `${FileSystem.documentDirectory}tiles/`;

/**
 * Check if a style supports offline tile serving
 */
export function isOfflineSupportedStyle(styleKey: MapStyleKey): boolean {
  return OFFLINE_RASTER_STYLES.includes(styleKey as any);
}

/**
 * Check if we have cached tiles for a style in a specific area
 */
export async function hasCachedTilesForBounds(
  styleKey: MapStyleKey,
  bounds: BoundingBox,
  cachedRegions: CachedTileRegion[]
): Promise<boolean> {
  // Find cached regions for this style that overlap with the bounds
  const matchingRegions = cachedRegions.filter((region) => {
    if (region.styleKey !== styleKey) return false;

    // Check if region bounds overlap with requested bounds
    return (
      region.bounds.south <= bounds.north &&
      region.bounds.north >= bounds.south &&
      region.bounds.west <= bounds.east &&
      region.bounds.east >= bounds.west
    );
  });

  return matchingRegions.length > 0;
}

/**
 * Build an offline-capable map style object
 * For raster styles, this returns a style object with file:// URLs pointing to cached tiles
 *
 * Note: MapLibre React Native may have limitations with file:// URLs for tiles.
 * This function provides the structure, but the actual implementation may require
 * additional configuration or native module support.
 */
export function buildOfflineMapStyle(
  styleKey: MapStyleKey,
  cachedRegions: CachedTileRegion[]
): object | string {
  // Only modify raster styles
  if (!isOfflineSupportedStyle(styleKey)) {
    return MAP_STYLES[styleKey];
  }

  // Check if we have any cached tiles for this style
  const hasCache = cachedRegions.some((r) => r.styleKey === styleKey);
  if (!hasCache) {
    return MAP_STYLES[styleKey];
  }

  // Build a style object with local tile source
  // The tiles will be served from the local file system
  const localTileUrl = `file://${TILES_DIRECTORY}${styleKey}/{z}/{x}/{y}.png`;

  return {
    version: 8,
    name: `${styleKey}-offline`,
    sources: {
      [`${styleKey}-offline`]: {
        type: 'raster',
        tiles: [localTileUrl],
        tileSize: 256,
        maxzoom: 14,
        minzoom: 10,
      },
    },
    layers: [
      {
        id: `${styleKey}-layer`,
        type: 'raster',
        source: `${styleKey}-offline`,
        minzoom: 0,
        maxzoom: 22,
      },
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  };
}

/**
 * Get the map style to use, preferring offline if available
 * @param styleKey - The requested map style
 * @param cachedRegions - List of cached tile regions
 * @param isOffline - Whether the device is offline
 * @returns The style to use (either the original URL/object or an offline version)
 */
export function getMapStyleWithOfflineSupport(
  styleKey: MapStyleKey,
  cachedRegions: CachedTileRegion[],
  isOffline: boolean = false
): object | string {
  // If online and not a priority offline style, use original
  if (!isOffline && !isOfflineSupportedStyle(styleKey)) {
    return MAP_STYLES[styleKey];
  }

  // Check if we have cached tiles for this style
  const hasCache = cachedRegions.some((r) => r.styleKey === styleKey);

  if (hasCache && isOffline) {
    logger.info('offline', `Using offline tiles for style: ${styleKey}`);
    return buildOfflineMapStyle(styleKey, cachedRegions);
  }

  // Fall back to original style
  return MAP_STYLES[styleKey];
}

/**
 * Create a custom tile source URL resolver
 * This can be used with custom map rendering to serve tiles from local cache
 */
export function createTileResolver(styleKey: MapStyleKey) {
  return async (x: number, y: number, z: number): Promise<string | null> => {
    const cached = await isTileCached(styleKey, z, x, y);
    if (cached) {
      return getTilePath(styleKey, z, x, y);
    }
    return null;
  };
}

/**
 * Get cached tile regions info for a specific style
 */
export function getCachedRegionsForStyle(
  styleKey: MapStyleKey,
  cachedRegions: CachedTileRegion[]
): CachedTileRegion[] {
  return cachedRegions.filter((r) => r.styleKey === styleKey);
}

/**
 * Get total cached size for a style
 */
export function getCachedSizeForStyle(
  styleKey: MapStyleKey,
  cachedRegions: CachedTileRegion[]
): number {
  return cachedRegions
    .filter((r) => r.styleKey === styleKey)
    .reduce((total, r) => total + r.sizeBytes, 0);
}

/**
 * Get zoom range covered by cached regions for a style
 */
export function getCachedZoomRange(
  styleKey: MapStyleKey,
  cachedRegions: CachedTileRegion[]
): { minZoom: number; maxZoom: number } | null {
  const styleRegions = cachedRegions.filter((r) => r.styleKey === styleKey);

  if (styleRegions.length === 0) return null;

  let minZoom = Infinity;
  let maxZoom = -Infinity;

  for (const region of styleRegions) {
    minZoom = Math.min(minZoom, region.minZoom);
    maxZoom = Math.max(maxZoom, region.maxZoom);
  }

  return { minZoom, maxZoom };
}
