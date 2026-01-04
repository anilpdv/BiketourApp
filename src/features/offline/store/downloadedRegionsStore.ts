/**
 * Downloaded Regions Store
 * Manages the list of downloaded regions and stats
 */

import { create } from 'zustand';
import {
  DownloadedRegion,
  getDownloadedRegions,
  deleteDownloadedRegion,
  getDownloadStats,
} from '../services/poiDownload.service';
import { logger } from '../../../shared/utils';

interface DownloadedRegionsState {
  // Region list
  downloadedRegions: DownloadedRegion[];
  isLoadingRegions: boolean;

  // Stats
  totalPOIs: number;
  totalSizeBytes: number;

  // Error
  error: string | null;

  // Actions
  loadDownloadedRegions: () => Promise<void>;
  deleteRegion: (regionId: string) => Promise<void>;
  loadStats: () => Promise<void>;
  clearError: () => void;

  // Selectors
  getRegionNames: () => string[];
  isRegionDownloaded: (regionName: string, minPOIs?: number) => boolean;
}

export const useDownloadedRegionsStore = create<DownloadedRegionsState>((set, get) => ({
  downloadedRegions: [],
  isLoadingRegions: false,
  totalPOIs: 0,
  totalSizeBytes: 0,
  error: null,

  loadDownloadedRegions: async () => {
    set({ isLoadingRegions: true, error: null });
    try {
      const regions = await getDownloadedRegions();
      const stats = await getDownloadStats();
      set({
        downloadedRegions: regions,
        totalPOIs: stats.totalPOIs,
        totalSizeBytes: stats.sizeBytes,
        isLoadingRegions: false,
      });
    } catch (error) {
      logger.error('offline', 'Failed to load regions', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load regions',
        isLoadingRegions: false,
      });
    }
  },

  deleteRegion: async (regionId) => {
    set({ error: null });
    try {
      await deleteDownloadedRegion(regionId);
      await get().loadDownloadedRegions();
    } catch (error) {
      logger.error('offline', 'Failed to delete region', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete region',
      });
    }
  },

  loadStats: async () => {
    try {
      const stats = await getDownloadStats();
      set({
        totalPOIs: stats.totalPOIs,
        totalSizeBytes: stats.sizeBytes,
      });
    } catch (error) {
      logger.warn('offline', 'Failed to load stats', error);
    }
  },

  clearError: () => set({ error: null }),

  getRegionNames: () => {
    return get().downloadedRegions.map((r) => r.name);
  },

  isRegionDownloaded: (regionName, minPOIs = 10) => {
    const { downloadedRegions } = get();
    return downloadedRegions.some(
      (r) => r.name === regionName && r.poiCount >= minPOIs
    );
  },
}));
