/**
 * Tile Download Types
 * Type definitions for offline map tile downloading
 */

import { BoundingBox } from '../../pois/types';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';

/**
 * Represents a single map tile coordinate
 */
export interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

/**
 * Progress tracking for tile downloads
 */
export interface TileDownloadProgress {
  phase: 'preparing' | 'downloading' | 'complete' | 'error' | 'cancelled';
  currentTile: number;
  totalTiles: number;
  percentage: number;
  currentZoom: number;
  failedTiles: number;
  bytesDownloaded: number;
  message?: string;
}

/**
 * Estimate of download size and tile count
 */
export interface TileEstimate {
  tileCount: number;
  estimatedSizeBytes: number;
}

/**
 * Cached tile region stored in database
 */
export interface CachedTileRegion {
  id: string;
  styleKey: MapStyleKey;
  name: string;
  bounds: BoundingBox;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  sizeBytes: number;
  downloadedAt: number;
}

/**
 * Options for downloading tiles
 */
export interface TileDownloadOptions {
  bounds: BoundingBox;
  styleKey: MapStyleKey;
  minZoom?: number;
  maxZoom?: number;
  regionName?: string;
  onProgress?: (progress: TileDownloadProgress) => void;
  abortSignal?: AbortSignal;
}

/**
 * Result of a tile download operation
 */
export interface TileDownloadResult {
  regionId: string;
  regionName: string;
  styleKey: MapStyleKey;
  tileCount: number;
  sizeBytes: number;
  failedTiles: number;
}

/**
 * Combined download options for POIs + Tiles
 */
export interface CombinedDownloadOptions {
  downloadPOIs: boolean;
  downloadTiles: boolean;
  styleKey?: MapStyleKey;
}

/**
 * Combined download progress
 */
export interface CombinedDownloadProgress {
  phase: 'pois' | 'tiles' | 'complete' | 'error' | 'cancelled';
  poiProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
  tileProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
  overallPercentage: number;
  message?: string;
}

/**
 * Map style configurations for offline tile serving
 */
export type RasterStyleKey = 'cyclosm' | 'satellite' | 'topo' | 'terrain' | 'natgeo';
export type VectorStyleKey = 'outdoors' | 'streets' | 'light' | 'dark';

/**
 * Styles that support offline tile caching
 */
export const OFFLINE_RASTER_STYLES: RasterStyleKey[] = ['cyclosm', 'satellite', 'topo'];
export const OFFLINE_VECTOR_STYLES: VectorStyleKey[] = ['outdoors'];
export const OFFLINE_SUPPORTED_STYLES: MapStyleKey[] = [...OFFLINE_RASTER_STYLES, ...OFFLINE_VECTOR_STYLES];

/**
 * Average tile sizes by style (in KB)
 */
export const TILE_SIZE_ESTIMATES: Partial<Record<MapStyleKey, number>> = {
  cyclosm: 25,      // CyclOSM PNG tiles
  satellite: 40,    // ESRI satellite imagery (higher quality)
  topo: 20,         // ESRI topographic
  terrain: 15,      // Hillshade (grayscale)
  natgeo: 25,       // National Geographic
  outdoors: 15,     // Vector tiles (compressed)
  streets: 15,      // Vector tiles
  light: 10,        // Minimal vector tiles
  dark: 10,         // Minimal vector tiles
};

/**
 * Default zoom range for downloads
 */
export const DEFAULT_MIN_ZOOM = 10;
export const DEFAULT_MAX_ZOOM = 14;
