/**
 * Download Estimation Service
 * Functions for estimating POI download size and count
 */

import { POICategory, BoundingBox } from '../../pois/types';
import { POI_CATEGORIES } from '../../pois/config/poiCategoryConfig';
import { calculateBoundsFromRadius, getTilesCoveringBounds } from './downloadBounds.service';

// Estimated bytes per POI (for size estimation)
const BYTES_PER_POI_ESTIMATE = 500;

export interface DownloadEstimate {
  estimatedPOIs: number;
  estimatedSizeBytes: number;
  tilesRequired: number;
}

/**
 * Estimate download size for an area (radius-based)
 */
export function estimateDownload(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  categories: POICategory[]
): DownloadEstimate {
  const bounds = calculateBoundsFromRadius(centerLat, centerLon, radiusKm);
  return estimateDownloadForBounds(bounds, categories);
}

/**
 * Estimate download size for a bounding box (region-based)
 */
export function estimateDownloadForBounds(
  bounds: BoundingBox,
  categories: POICategory[]
): DownloadEstimate {
  const tiles = getTilesCoveringBounds(bounds);

  // Rough estimation based on area and urban density
  // Urban areas: ~50 POIs per tile, Rural: ~10 POIs per tile
  // Average: ~25 POIs per tile for all categories
  const avgPOIsPerTile = 25 * (categories.length / POI_CATEGORIES.length);
  const estimatedPOIs = Math.round(tiles.length * avgPOIsPerTile);
  const estimatedSizeBytes = estimatedPOIs * BYTES_PER_POI_ESTIMATE;

  return {
    estimatedPOIs,
    estimatedSizeBytes,
    tilesRequired: tiles.length,
  };
}

/**
 * Format estimated size for display
 */
export function formatEstimatedSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Get a human-readable estimate summary
 */
export function getEstimateSummary(estimate: DownloadEstimate): string {
  const size = formatEstimatedSize(estimate.estimatedSizeBytes);
  return `~${estimate.estimatedPOIs.toLocaleString()} POIs (${size})`;
}
