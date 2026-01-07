/**
 * Download Progress Store
 * Manages state for in-flight POI downloads
 */

import { create } from 'zustand';
import { POICategory } from '../../pois/types';
import { usePOIStore } from '../../pois/store/poiStore';
import {
  DownloadProgress,
  DownloadResult,
  downloadPOIsForArea,
} from '../services/poiDownload.service';
import { RegionInfo } from '../services/regionDetection.service';
import { logger } from '../../../shared/utils';

// All available POI categories
export const ALL_POI_CATEGORIES: POICategory[] = [
  'campsite',
  'motorhome_spot',
  'caravan_site',
  'wild_camping',
  'service_area',
  'drinking_water',
  'toilet',
  'shower',
  'laundry',
  'hotel',
  'hostel',
  'guest_house',
  'shelter',
  'bike_shop',
  'bike_repair',
  'restaurant',
  'supermarket',
  'picnic_site',
  'hospital',
  'pharmacy',
  'police',
];

export interface CurrentDownload {
  regionName: string;
  progress: DownloadProgress;
  abortController: AbortController;
}

interface DownloadProgressState {
  // Download state
  isDownloading: boolean;
  currentDownload: CurrentDownload | null;
  error: string | null;
  downloadId: number; // Unique ID to track current download session and detect stale results

  // Actions
  startDownload: (
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    regionName?: string,
    boundingBox?: { north: number; south: number; east: number; west: number }
  ) => Promise<DownloadResult | null>;
  startRegionDownload: (region: RegionInfo) => Promise<DownloadResult | null>;
  cancelDownload: () => void;
  clearError: () => void;

  // Callbacks for external coordination
  onDownloadComplete?: () => Promise<void>;
  setOnDownloadComplete: (callback: () => Promise<void>) => void;
}

export const useDownloadProgressStore = create<DownloadProgressState>((set, get) => ({
  isDownloading: false,
  currentDownload: null,
  error: null,
  downloadId: 0,
  onDownloadComplete: undefined,

  setOnDownloadComplete: (callback) => {
    set({ onDownloadComplete: callback });
  },

  startDownload: async (centerLat, centerLon, radiusKm, regionName, boundingBox) => {
    // GUARD: Prevent concurrent downloads (fixes race condition)
    if (get().isDownloading) {
      logger.warn('offline', 'Download already in progress, ignoring duplicate start');
      return null;
    }

    // Generate unique download ID for this session
    const thisDownloadId = Date.now();
    const abortController = new AbortController();

    set({
      isDownloading: true,
      downloadId: thisDownloadId,
      error: null,
      currentDownload: {
        regionName: regionName || 'Downloading...',
        progress: {
          phase: 'downloading',
          currentPOIs: 0,
          totalPOIs: 0,
          percentage: 2,
          currentTile: 0,
          totalTiles: 0,
          failedTiles: 0,
        },
        abortController,
      },
    });

    try {
      const result = await downloadPOIsForArea({
        centerLat,
        centerLon,
        radiusKm,
        categories: ALL_POI_CATEGORIES,
        regionName,
        boundingBox,
        onProgress: (progress) => {
          // STALE CHECK: Only update if this is still the current download
          if (get().downloadId !== thisDownloadId) return;
          set((state) => ({
            currentDownload: state.currentDownload
              ? {
                  ...state.currentDownload,
                  progress,
                  regionName: progress.message || state.currentDownload.regionName,
                }
              : null,
          }));
        },
        abortSignal: abortController.signal,
      });

      // STALE CHECK: Verify this download is still the current one
      if (get().downloadId !== thisDownloadId) {
        logger.info('offline', 'Download result ignored (superseded by newer download)');
        return null;
      }

      // Add downloaded POIs directly to the store for immediate display
      // This avoids timing issues with database queries
      if (result.pois && result.pois.length > 0) {
        const { addPOIs, setDownloadProtection } = usePOIStore.getState();

        // Enable protection BEFORE adding POIs (5 second grace period)
        // This prevents subsequent setPOIs calls from wiping these POIs during fly animation
        setDownloadProtection(5000);

        addPOIs(result.pois);
        logger.info('offline', 'Added downloaded POIs to store with protection', {
          count: result.pois.length,
          protectionMs: 5000,
        });
      }

      // Notify completion
      const { onDownloadComplete } = get();
      if (onDownloadComplete) {
        await onDownloadComplete();
      }

      // Keep showing 100% progress for a moment so user sees completion
      await new Promise(resolve => setTimeout(resolve, 800));

      set({
        isDownloading: false,
        currentDownload: null,
      });

      return result;
    } catch (error) {
      // STALE CHECK: Don't set error state if superseded
      if (get().downloadId !== thisDownloadId) {
        return null;
      }

      const isCancelled = error instanceof Error && error.message === 'Download cancelled';

      set({
        isDownloading: false,
        currentDownload: null,
        error: isCancelled ? null : (error instanceof Error ? error.message : 'Download failed'),
      });

      if (!isCancelled) {
        logger.error('offline', 'Download failed', error);
      }

      return null;
    }
  },

  startRegionDownload: async (region) => {
    const { boundingBox } = region;

    // Calculate center and approximate radius from bounding box
    const centerLat = (boundingBox.north + boundingBox.south) / 2;
    const centerLon = (boundingBox.east + boundingBox.west) / 2;

    // Calculate approximate radius (half of the diagonal)
    const latDiff = boundingBox.north - boundingBox.south;
    const lonDiff = boundingBox.east - boundingBox.west;
    const latKm = latDiff * 111;
    const lonKm = lonDiff * 111 * Math.cos((centerLat * Math.PI) / 180);
    const radiusKm = Math.min(Math.sqrt(latKm * latKm + lonKm * lonKm) / 2, 200);

    return get().startDownload(
      centerLat,
      centerLon,
      radiusKm,
      region.displayName,
      region.boundingBox
    );
  },

  cancelDownload: () => {
    const { currentDownload } = get();
    if (currentDownload) {
      currentDownload.abortController.abort();
      set({
        isDownloading: false,
        currentDownload: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
