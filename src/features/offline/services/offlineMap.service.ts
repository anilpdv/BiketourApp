import { OfflineManager } from '@maplibre/maplibre-react-native';
import { DEFAULT_MAP_STYLE } from '../../../shared/config/mapbox.config';
import { logger } from '../../../shared/utils';

// Type for metadata stored with offline regions
type OfflineMetadata = Record<string, unknown>;

// Type for offline pack from callbacks
interface OfflinePackInfo {
  name: string;
  bounds: [[number, number], [number, number]];
  metadata?: OfflineMetadata;
}

export interface OfflineRegion {
  name: string;
  bounds: [[number, number], [number, number]]; // [SW, NE] as [lng, lat]
  minZoom: number;
  maxZoom: number;
  metadata?: OfflineMetadata;
}

export interface OfflinePackStatus {
  name: string;
  state: 'inactive' | 'active' | 'complete' | 'unknown';
  percentage: number;
  completedResourceCount: number;
  completedResourceSize: number;
  completedTileCount: number;
  completedTileSize: number;
  requiredResourceCount: number;
  errorReason?: string;
}

export interface OfflinePack {
  name: string;
  bounds: string;
  metadata: OfflineMetadata;
  status?: OfflinePackStatus;
}

export type DownloadProgressCallback = (pack: OfflinePackInfo, status: OfflinePackStatus) => void;
export type DownloadErrorCallback = (pack: OfflinePackInfo, error: Error) => void;

/**
 * Download an offline region for use without internet connection
 */
export async function downloadOfflineRegion(
  region: OfflineRegion,
  onProgress?: DownloadProgressCallback,
  onError?: DownloadErrorCallback
): Promise<void> {
  // Progress listener
  const progressListener = (pack: unknown, status: unknown) => {
    if (onProgress) {
      onProgress(pack as OfflinePackInfo, status as OfflinePackStatus);
    }
  };

  // Error listener (required by MapLibre)
  const errorListener = (pack: unknown, error: unknown) => {
    logger.error('offline', 'Offline pack download error', { pack, error });
    if (onError) {
      onError(pack as OfflinePackInfo, error as Error);
    }
  };

  await OfflineManager.createPack(
    {
      name: region.name,
      styleURL: DEFAULT_MAP_STYLE,
      bounds: region.bounds,
      minZoom: region.minZoom,
      maxZoom: region.maxZoom,
      metadata: {
        ...region.metadata,
        minZoom: region.minZoom,
        maxZoom: region.maxZoom,
        createdAt: new Date().toISOString(),
      },
    },
    progressListener,
    errorListener
  );
}

/**
 * Get all downloaded offline regions
 */
export async function getOfflineRegions(): Promise<OfflinePack[]> {
  const packs = await OfflineManager.getPacks();
  return packs as unknown as OfflinePack[];
}

/**
 * Delete an offline region by name
 */
export async function deleteOfflineRegion(name: string): Promise<void> {
  await OfflineManager.deletePack(name);
}

/**
 * Reset the offline database (use with caution)
 */
export async function resetOfflineDatabase(): Promise<void> {
  await OfflineManager.resetDatabase();
}

/**
 * Calculate bounds from route points with a buffer (in km)
 */
export function calculateRouteBounds(
  points: Array<{ latitude: number; longitude: number }>,
  bufferKm: number = 5
): [[number, number], [number, number]] {
  if (points.length === 0) {
    throw new Error('No points provided');
  }

  // Find min/max coordinates
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  // Add buffer (rough conversion: 1 degree ~= 111 km)
  const bufferDeg = bufferKm / 111;

  return [
    [minLon - bufferDeg, minLat - bufferDeg], // SW corner [lng, lat]
    [maxLon + bufferDeg, maxLat + bufferDeg], // NE corner [lng, lat]
  ];
}

/**
 * Estimate download size in MB for a region
 * This is a rough estimate based on tile counts
 */
export function estimateDownloadSize(
  bounds: [[number, number], [number, number]],
  minZoom: number,
  maxZoom: number
): number {
  const [sw, ne] = bounds;
  const lonRange = ne[0] - sw[0];
  const latRange = ne[1] - sw[1];

  let totalTiles = 0;
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const tilesPerDegree = Math.pow(2, zoom) / 360;
    const tilesX = Math.ceil(lonRange * tilesPerDegree);
    const tilesY = Math.ceil(latRange * tilesPerDegree);
    totalTiles += tilesX * tilesY;
  }

  // Rough estimate: ~20KB per tile on average
  return Math.round((totalTiles * 20) / 1024);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
