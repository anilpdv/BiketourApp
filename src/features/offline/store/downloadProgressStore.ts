/**
 * Download Progress Store
 * Manages state for in-flight POI downloads
 */

import { create } from 'zustand';
import { POICategory } from '../../pois/types';
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
  onDownloadComplete: undefined,

  setOnDownloadComplete: (callback) => {
    set({ onDownloadComplete: callback });
  },

  startDownload: async (centerLat, centerLon, radiusKm, regionName, boundingBox) => {
    const abortController = new AbortController();

    set({
      isDownloading: true,
      error: null,
      currentDownload: {
        regionName: regionName || 'Downloading...',
        progress: {
          phase: 'estimating',
          currentPOIs: 0,
          totalPOIs: 0,
          percentage: 0,
          currentTile: 0,
          totalTiles: 0,
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

      // Notify completion
      const { onDownloadComplete } = get();
      if (onDownloadComplete) {
        await onDownloadComplete();
      }

      set({
        isDownloading: false,
        currentDownload: null,
      });

      return result;
    } catch (error) {
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
