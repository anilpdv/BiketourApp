/**
 * Tile Download Store
 * Manages state for map tile downloads
 */

import { create } from 'zustand';
import { BoundingBox } from '../../pois/types';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';
import { logger } from '../../../shared/utils';
import {
  TileDownloadProgress,
  CachedTileRegion,
  DEFAULT_MIN_ZOOM,
  DEFAULT_MAX_ZOOM,
} from '../types/tiles';
import {
  downloadTilesForRegion,
  calculateTileBoundsForRegion,
} from '../services/tileDownload.service';
import { deleteTilesInRegion } from '../services/tileCache.service';
import { database, cachedTileRegionsCollection } from '../../../shared/database/watermelon/database';
import { Q } from '@nozbe/watermelondb';

export interface CurrentTileDownload {
  regionId: string;
  regionName: string;
  styleKey: MapStyleKey;
  progress: TileDownloadProgress;
  abortController: AbortController;
}

interface TileDownloadState {
  // Download state
  isDownloadingTiles: boolean;
  currentTileDownload: CurrentTileDownload | null;
  error: string | null;
  downloadId: number;

  // Cached regions
  cachedTileRegions: CachedTileRegion[];
  isLoading: boolean;

  // Actions
  startTileDownload: (
    bounds: BoundingBox,
    styleKey: MapStyleKey,
    regionName?: string,
    minZoom?: number,
    maxZoom?: number
  ) => Promise<CachedTileRegion | null>;
  cancelTileDownload: () => void;
  loadCachedRegions: () => Promise<void>;
  deleteCachedRegion: (regionId: string) => Promise<void>;
  clearError: () => void;

  // Helpers
  hasCachedTilesForStyle: (styleKey: MapStyleKey) => boolean;
  hasCachedTilesInBounds: (bounds: BoundingBox, styleKey: MapStyleKey) => boolean;
}

export const useTileDownloadStore = create<TileDownloadState>((set, get) => ({
  isDownloadingTiles: false,
  currentTileDownload: null,
  error: null,
  downloadId: 0,
  cachedTileRegions: [],
  isLoading: false,

  startTileDownload: async (
    bounds,
    styleKey,
    regionName,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM
  ) => {
    // Prevent concurrent downloads
    if (get().isDownloadingTiles) {
      logger.warn('offline', 'Tile download already in progress');
      return null;
    }

    const thisDownloadId = Date.now();
    const abortController = new AbortController();

    set({
      isDownloadingTiles: true,
      downloadId: thisDownloadId,
      error: null,
      currentTileDownload: {
        regionId: '',
        regionName: regionName || 'Map tiles',
        styleKey,
        progress: {
          phase: 'preparing',
          currentTile: 0,
          totalTiles: 0,
          percentage: 0,
          currentZoom: minZoom,
          failedTiles: 0,
          bytesDownloaded: 0,
        },
        abortController,
      },
    });

    try {
      const result = await downloadTilesForRegion({
        bounds,
        styleKey,
        minZoom,
        maxZoom,
        regionName,
        onProgress: (progress) => {
          // Stale check
          if (get().downloadId !== thisDownloadId) return;

          set((state) => ({
            currentTileDownload: state.currentTileDownload
              ? {
                  ...state.currentTileDownload,
                  progress,
                }
              : null,
          }));
        },
        abortSignal: abortController.signal,
      });

      // Stale check
      if (get().downloadId !== thisDownloadId) {
        logger.info('offline', 'Tile download result ignored (superseded)');
        return null;
      }

      // Save to database
      const cachedRegion = await saveCachedTileRegion({
        id: result.regionId,
        styleKey: result.styleKey,
        name: result.regionName,
        bounds,
        minZoom,
        maxZoom,
        tileCount: result.tileCount,
        sizeBytes: result.sizeBytes,
        downloadedAt: Date.now(),
      });

      // Update local state
      set((state) => ({
        isDownloadingTiles: false,
        currentTileDownload: null,
        cachedTileRegions: [...state.cachedTileRegions, cachedRegion],
      }));

      logger.info('offline', 'Tile download complete', {
        regionId: result.regionId,
        tileCount: result.tileCount,
        sizeBytes: result.sizeBytes,
      });

      return cachedRegion;
    } catch (error) {
      // Stale check
      if (get().downloadId !== thisDownloadId) {
        return null;
      }

      const isCancelled = error instanceof Error && error.message === 'Download cancelled';

      set({
        isDownloadingTiles: false,
        currentTileDownload: null,
        error: isCancelled ? null : (error instanceof Error ? error.message : 'Tile download failed'),
      });

      if (!isCancelled) {
        logger.error('offline', 'Tile download failed', error);
      }

      return null;
    }
  },

  cancelTileDownload: () => {
    const { currentTileDownload } = get();
    if (currentTileDownload) {
      currentTileDownload.abortController.abort();
      set({
        isDownloadingTiles: false,
        currentTileDownload: null,
      });
    }
  },

  loadCachedRegions: async () => {
    set({ isLoading: true });

    try {
      const regions = await cachedTileRegionsCollection.query().fetch();

      const cachedTileRegions: CachedTileRegion[] = regions.map((r) => ({
        id: r.regionId,
        styleKey: r.styleKey as MapStyleKey,
        name: r.name,
        bounds: r.bounds,
        minZoom: r.minZoom,
        maxZoom: r.maxZoom,
        tileCount: r.tileCount,
        sizeBytes: r.sizeBytes,
        downloadedAt: r.downloadedAt,
      }));

      set({ cachedTileRegions, isLoading: false });
    } catch (error) {
      logger.error('offline', 'Failed to load cached tile regions', error);
      set({ isLoading: false });
    }
  },

  deleteCachedRegion: async (regionId) => {
    try {
      // Find the region
      const regions = await cachedTileRegionsCollection
        .query(Q.where('region_id', regionId))
        .fetch();

      if (regions.length === 0) {
        logger.warn('offline', 'Region not found for deletion', { regionId });
        return;
      }

      const region = regions[0];

      // Calculate tile bounds for deletion
      const tileBounds = calculateTileBoundsForRegion(
        region.bounds,
        region.minZoom,
        region.maxZoom
      );

      // Delete tiles from file system
      await deleteTilesInRegion(
        region.styleKey as MapStyleKey,
        tileBounds.minX,
        tileBounds.maxX,
        tileBounds.minY,
        tileBounds.maxY,
        region.minZoom,
        region.maxZoom
      );

      // Delete from database
      await database.write(async () => {
        await region.destroyPermanently();
      });

      // Update local state
      set((state) => ({
        cachedTileRegions: state.cachedTileRegions.filter((r) => r.id !== regionId),
      }));

      logger.info('offline', 'Deleted cached tile region', { regionId });
    } catch (error) {
      logger.error('offline', 'Failed to delete cached tile region', error);
    }
  },

  clearError: () => set({ error: null }),

  hasCachedTilesForStyle: (styleKey) => {
    return get().cachedTileRegions.some((r) => r.styleKey === styleKey);
  },

  hasCachedTilesInBounds: (bounds, styleKey) => {
    return get().cachedTileRegions.some((r) => {
      if (r.styleKey !== styleKey) return false;

      // Check if region bounds overlap with requested bounds
      return (
        r.bounds.south <= bounds.north &&
        r.bounds.north >= bounds.south &&
        r.bounds.west <= bounds.east &&
        r.bounds.east >= bounds.west
      );
    });
  },
}));

/**
 * Save a cached tile region to the database
 */
async function saveCachedTileRegion(region: CachedTileRegion): Promise<CachedTileRegion> {
  await database.write(async () => {
    await cachedTileRegionsCollection.create((record) => {
      record._raw.id = region.id;
      record.regionId = region.id;
      record.styleKey = region.styleKey;
      record.name = region.name;
      record.minLat = region.bounds.south;
      record.maxLat = region.bounds.north;
      record.minLon = region.bounds.west;
      record.maxLon = region.bounds.east;
      record.minZoom = region.minZoom;
      record.maxZoom = region.maxZoom;
      record.tileCount = region.tileCount;
      record.sizeBytes = region.sizeBytes;
      record.downloadedAt = region.downloadedAt;
    });
  });

  return region;
}

/**
 * Get total size of all cached tiles
 */
export function getTotalCachedTileSize(state: TileDownloadState): number {
  return state.cachedTileRegions.reduce((total, r) => total + r.sizeBytes, 0);
}

/**
 * Get total tile count across all cached regions
 */
export function getTotalCachedTileCount(state: TileDownloadState): number {
  return state.cachedTileRegions.reduce((total, r) => total + r.tileCount, 0);
}
