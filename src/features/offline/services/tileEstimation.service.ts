/**
 * Tile Estimation Service
 * Estimates tile count and download size for offline map regions
 */

import { BoundingBox } from '../../pois/types';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';
import {
  TileEstimate,
  TILE_SIZE_ESTIMATES,
  DEFAULT_MIN_ZOOM,
  DEFAULT_MAX_ZOOM,
} from '../types/tiles';
import { getTilesInBounds } from './tileDownload.service';

/**
 * Calculate the total number of tiles for a bounding box across zoom levels
 */
export function calculateTileCount(
  bounds: BoundingBox,
  minZoom: number = DEFAULT_MIN_ZOOM,
  maxZoom: number = DEFAULT_MAX_ZOOM
): number {
  let totalTiles = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    const tiles = getTilesInBounds(bounds, z);
    totalTiles += tiles.length;
  }

  return totalTiles;
}

/**
 * Estimate download size for a tile region
 */
export function estimateTileDownload(
  bounds: BoundingBox,
  styleKey: MapStyleKey,
  minZoom: number = DEFAULT_MIN_ZOOM,
  maxZoom: number = DEFAULT_MAX_ZOOM
): TileEstimate {
  const tileCount = calculateTileCount(bounds, minZoom, maxZoom);

  // Get average tile size for this style (in KB)
  const avgTileSizeKB = TILE_SIZE_ESTIMATES[styleKey] || 20;

  // Convert to bytes
  const estimatedSizeBytes = tileCount * avgTileSizeKB * 1024;

  return {
    tileCount,
    estimatedSizeBytes,
  };
}

/**
 * Estimate download size for a radius-based region
 */
export function estimateTileDownloadForRadius(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  styleKey: MapStyleKey,
  minZoom: number = DEFAULT_MIN_ZOOM,
  maxZoom: number = DEFAULT_MAX_ZOOM
): TileEstimate {
  // Convert radius to bounding box (approximate)
  const latDelta = radiusKm / 111; // ~111 km per degree of latitude
  const lonDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  const bounds: BoundingBox = {
    south: centerLat - latDelta,
    north: centerLat + latDelta,
    west: centerLon - lonDelta,
    east: centerLon + lonDelta,
  };

  return estimateTileDownload(bounds, styleKey, minZoom, maxZoom);
}

/**
 * Get breakdown of tiles by zoom level
 */
export function getTileCountByZoom(
  bounds: BoundingBox,
  minZoom: number = DEFAULT_MIN_ZOOM,
  maxZoom: number = DEFAULT_MAX_ZOOM
): Record<number, number> {
  const breakdown: Record<number, number> = {};

  for (let z = minZoom; z <= maxZoom; z++) {
    const tiles = getTilesInBounds(bounds, z);
    breakdown[z] = tiles.length;
  }

  return breakdown;
}

/**
 * Format bytes to human-readable string
 */
export function formatTileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get user-friendly size estimate string
 */
export function getEstimateString(estimate: TileEstimate): string {
  return `~${estimate.tileCount.toLocaleString()} tiles (${formatTileSize(estimate.estimatedSizeBytes)})`;
}

/**
 * Check if a download is "large" (might want to warn user)
 * Threshold: 50MB or 2000 tiles
 */
export function isLargeDownload(estimate: TileEstimate): boolean {
  const LARGE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  const LARGE_TILE_COUNT = 2000;

  return estimate.estimatedSizeBytes > LARGE_SIZE_BYTES || estimate.tileCount > LARGE_TILE_COUNT;
}

/**
 * Get recommended zoom range based on region size
 */
export function getRecommendedZoomRange(bounds: BoundingBox): { minZoom: number; maxZoom: number } {
  // Calculate region size in km
  const latRange = bounds.north - bounds.south;
  const lonRange = bounds.east - bounds.west;
  const avgLat = (bounds.north + bounds.south) / 2;

  const heightKm = latRange * 111;
  const widthKm = lonRange * 111 * Math.cos((avgLat * Math.PI) / 180);
  const maxDimension = Math.max(heightKm, widthKm);

  // Adjust zoom range based on region size
  if (maxDimension > 200) {
    // Large region (country level)
    return { minZoom: 8, maxZoom: 12 };
  } else if (maxDimension > 100) {
    // Medium region (large area)
    return { minZoom: 9, maxZoom: 13 };
  } else if (maxDimension > 50) {
    // Normal region
    return { minZoom: 10, maxZoom: 14 };
  } else {
    // Small region
    return { minZoom: 11, maxZoom: 15 };
  }
}

/**
 * Get combined estimate for POIs + Tiles
 */
export function getCombinedEstimate(
  poiEstimate: { poiCount: number; sizeBytes: number },
  tileEstimate: TileEstimate
): {
  totalSizeBytes: number;
  totalSizeString: string;
  poiSizeString: string;
  tileSizeString: string;
} {
  const totalSizeBytes = poiEstimate.sizeBytes + tileEstimate.estimatedSizeBytes;

  return {
    totalSizeBytes,
    totalSizeString: formatTileSize(totalSizeBytes),
    poiSizeString: formatTileSize(poiEstimate.sizeBytes),
    tileSizeString: formatTileSize(tileEstimate.estimatedSizeBytes),
  };
}
