/**
 * POI Download Store
 * Manages state for POI offline downloads with region-based detection
 */

import { create } from 'zustand';
import { POICategory } from '../../pois/types';
import {
  DownloadProgress,
  DownloadResult,
  DownloadedRegion,
  DownloadEstimate,
  downloadPOIsForArea,
  getDownloadedRegions,
  deleteDownloadedRegion,
  estimateDownload,
  getDownloadStats,
  estimateDownloadForBounds,
  shouldPromptForDownload,
} from '../services/poiDownload.service';
import {
  RegionInfo,
  detectCurrentRegion,
  isPointInRegion,
} from '../services/regionDetection.service';
import { logger } from '../../../shared/utils';

// All available POI categories
const ALL_POI_CATEGORIES: POICategory[] = [
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
  // Emergency categories
  'hospital',
  'pharmacy',
  'police',
];

// Default radius options in km
export const RADIUS_OPTIONS = [25, 50, 100] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

interface CurrentDownload {
  regionName: string;
  progress: DownloadProgress;
  abortController: AbortController;
}

interface DismissedArea {
  lat: number;
  lon: number;
  dismissedAt: Date;
}

interface POIDownloadState {
  // Downloaded regions
  downloadedRegions: DownloadedRegion[];
  isLoadingRegions: boolean;

  // Current download
  isDownloading: boolean;
  currentDownload: CurrentDownload | null;

  // Prompt state
  showPrompt: boolean;
  promptLocation: { lat: number; lon: number } | null;
  selectedRadius: RadiusOption;
  downloadEstimate: DownloadEstimate | null;
  isEstimating: boolean;

  // Region detection state
  currentRegion: RegionInfo | null;
  isDetectingRegion: boolean;

  // Download completion (for auto-pan to downloaded region)
  downloadCompletedRegion: RegionInfo | null;
  clearDownloadCompletedRegion: () => void;

  // Cooldown: prevent prompt from reappearing immediately after download
  lastDownloadCompletedAt: number | null;

  // Dismissed areas (don't prompt again soon)
  dismissedAreas: DismissedArea[];
  dismissedRegions: string[]; // Region display names that were dismissed

  // Stats
  totalPOIs: number;
  totalSizeBytes: number;

  // Error
  error: string | null;

  // Actions
  loadDownloadedRegions: () => Promise<void>;
  startDownload: (
    centerLat: number,
    centerLon: number,
    radiusKm: RadiusOption,
    regionName?: string
  ) => Promise<DownloadResult | null>;
  startRegionDownload: (region: RegionInfo) => Promise<DownloadResult | null>;
  cancelDownload: () => void;
  deleteRegion: (regionId: string) => Promise<void>;

  // Prompt actions (legacy radius-based)
  checkShouldPrompt: (lat: number, lon: number) => Promise<boolean>;
  showDownloadPrompt: (lat: number, lon: number) => void;
  hideDownloadPrompt: () => void;
  dismissPromptForArea: (lat: number, lon: number) => void;
  setSelectedRadius: (radius: RadiusOption) => void;
  updateEstimate: (lat: number, lon: number, radius: RadiusOption) => Promise<void>;

  // Region-based prompt actions
  checkShouldPromptForRegion: (lat: number, lon: number) => Promise<{
    shouldPrompt: boolean;
    region: RegionInfo | null;
  }>;
  showRegionDownloadPrompt: (region: RegionInfo) => void;
  dismissRegion: (regionName: string) => void;
  updateRegionEstimate: (region: RegionInfo) => Promise<void>;

  // Utility
  clearError: () => void;
  loadStats: () => Promise<void>;
}

// How long to remember dismissed areas (24 hours)
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

export const usePOIDownloadStore = create<POIDownloadState>((set, get) => ({
  // Initial state
  downloadedRegions: [],
  isLoadingRegions: false,
  isDownloading: false,
  currentDownload: null,
  showPrompt: false,
  promptLocation: null,
  selectedRadius: 50,
  downloadEstimate: null,
  isEstimating: false,
  currentRegion: null,
  isDetectingRegion: false,
  downloadCompletedRegion: null,
  lastDownloadCompletedAt: null,
  dismissedAreas: [],
  dismissedRegions: [],
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

  startDownload: async (centerLat, centerLon, radiusKm, regionName) => {
    const abortController = new AbortController();

    set({
      isDownloading: true,
      error: null,
      showPrompt: false,
      currentDownload: {
        regionName: regionName || `Downloading...`,
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

      // Reload regions after successful download
      await get().loadDownloadedRegions();

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

  checkShouldPrompt: async (lat, lon) => {
    const { dismissedAreas, isDownloading } = get();

    // Don't prompt if already downloading
    if (isDownloading) return false;

    // Check if area was recently dismissed
    const now = new Date();
    const recentDismissals = dismissedAreas.filter(
      (area) => now.getTime() - area.dismissedAt.getTime() < DISMISS_DURATION_MS
    );

    // Clean up old dismissals
    if (recentDismissals.length !== dismissedAreas.length) {
      set({ dismissedAreas: recentDismissals });
    }

    // Check if near a dismissed area (within 10km)
    for (const area of recentDismissals) {
      const distance = calculateDistance(lat, lon, area.lat, area.lon);
      if (distance < 10) {
        return false;
      }
    }

    // Check if covered by existing downloads
    return shouldPromptForDownload(lat, lon, 20);
  },

  showDownloadPrompt: (lat, lon) => {
    const { selectedRadius } = get();
    set({
      showPrompt: true,
      promptLocation: { lat, lon },
    });
    // Update estimate for current selection
    get().updateEstimate(lat, lon, selectedRadius);
  },

  hideDownloadPrompt: () => {
    set({
      showPrompt: false,
      promptLocation: null,
      downloadEstimate: null,
    });
  },

  dismissPromptForArea: (lat, lon) => {
    const { dismissedAreas } = get();
    set({
      showPrompt: false,
      promptLocation: null,
      downloadEstimate: null,
      dismissedAreas: [
        ...dismissedAreas,
        { lat, lon, dismissedAt: new Date() },
      ],
    });
  },

  setSelectedRadius: (radius) => {
    const { promptLocation } = get();
    set({ selectedRadius: radius });
    // Update estimate when radius changes
    if (promptLocation) {
      get().updateEstimate(promptLocation.lat, promptLocation.lon, radius);
    }
  },

  updateEstimate: async (lat, lon, radius) => {
    set({ isEstimating: true });
    try {
      const estimate = await estimateDownload(lat, lon, radius, ALL_POI_CATEGORIES);
      set({
        downloadEstimate: estimate,
        isEstimating: false,
      });
    } catch (error) {
      logger.warn('offline', 'Failed to estimate download', error);
      set({ isEstimating: false });
    }
  },

  clearError: () => set({ error: null }),

  clearDownloadCompletedRegion: () => set({ downloadCompletedRegion: null }),

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

  // ==================== Region-based methods ====================

  checkShouldPromptForRegion: async (lat, lon) => {
    const { dismissedRegions, isDownloading, downloadedRegions, isDetectingRegion, lastDownloadCompletedAt } = get();

    logger.info('offline', '[DEBUG] checkShouldPromptForRegion called', {
      lat,
      lon,
      isDownloading,
      isDetectingRegion,
      dismissedRegionsCount: dismissedRegions.length,
      downloadedRegionsCount: downloadedRegions.length,
    });

    // Don't prompt if already downloading or detecting
    if (isDownloading || isDetectingRegion) {
      logger.info('offline', '[DEBUG] Skip: already downloading or detecting');
      return { shouldPrompt: false, region: null };
    }

    // Cooldown: Don't prompt within 5 seconds of completing a download
    // This prevents the prompt from appearing before POIs are loaded and displayed
    const COOLDOWN_MS = 5000;
    if (lastDownloadCompletedAt && (Date.now() - lastDownloadCompletedAt) < COOLDOWN_MS) {
      logger.info('offline', '[DEBUG] Skip: within download cooldown period');
      return { shouldPrompt: false, region: null };
    }

    set({ isDetectingRegion: true });

    try {
      // Detect current region
      const region = await detectCurrentRegion(lat, lon);

      if (!region) {
        logger.info('offline', '[DEBUG] Skip: region not detected');
        set({ isDetectingRegion: false });
        return { shouldPrompt: false, region: null };
      }

      logger.info('offline', '[DEBUG] Region detected, checking conditions', {
        displayName: region.displayName,
        dismissedRegions,
        downloadedRegions: downloadedRegions.map(r => r.name),
      });

      // Check if region was dismissed
      if (dismissedRegions.includes(region.displayName)) {
        logger.info('offline', '[DEBUG] Skip: region was dismissed', { region: region.displayName });
        set({ isDetectingRegion: false, currentRegion: region });
        return { shouldPrompt: false, region };
      }

      // Check if region is already downloaded AND has POIs
      // Regions with 0 POIs (failed downloads) should prompt for re-download
      const MIN_POIS_FOR_VALID_DOWNLOAD = 10;
      const isAlreadyDownloaded = downloadedRegions.some(
        (r) =>
          (r.name === region.displayName || r.name === region.region) &&
          r.poiCount >= MIN_POIS_FOR_VALID_DOWNLOAD
      );

      if (isAlreadyDownloaded) {
        logger.info('offline', '[DEBUG] Skip: region already downloaded with POIs', { region: region.displayName });
        set({ isDetectingRegion: false, currentRegion: region });
        return { shouldPrompt: false, region };
      }

      // NOTE: Removed bounding box overlap check - it caused false positives
      // when neighboring regions had overlapping bounding boxes (e.g., Toulouse
      // in Occitania being incorrectly matched to Nouvelle-Aquitaine's bounds).
      // The name-based check above is sufficient.

      logger.info('offline', '[DEBUG] ✅ SHOULD PROMPT for region', { region: region.displayName });
      set({ isDetectingRegion: false, currentRegion: region });
      return { shouldPrompt: true, region };
    } catch (error) {
      logger.error('offline', 'Failed to check region', error);
      set({ isDetectingRegion: false });
      return { shouldPrompt: false, region: null };
    }
  },

  showRegionDownloadPrompt: (region) => {
    logger.info('offline', '[DEBUG] showRegionDownloadPrompt called', {
      region: region.displayName,
      settingShowPrompt: true,
    });
    set({
      showPrompt: true,
      currentRegion: region,
      promptLocation: {
        lat: (region.boundingBox.north + region.boundingBox.south) / 2,
        lon: (region.boundingBox.east + region.boundingBox.west) / 2,
      },
    });
    logger.info('offline', '[DEBUG] Store state updated', {
      showPrompt: true,
      region: region.displayName,
    });
    // Update estimate for region bounds
    get().updateRegionEstimate(region);
  },

  dismissRegion: (regionName) => {
    const { dismissedRegions } = get();
    set({
      showPrompt: false,
      currentRegion: null,
      promptLocation: null,
      downloadEstimate: null,
      dismissedRegions: [...dismissedRegions, regionName],
    });
  },

  updateRegionEstimate: async (region) => {
    set({ isEstimating: true });
    try {
      const estimate = await estimateDownloadForBounds(
        region.boundingBox,
        ALL_POI_CATEGORIES
      );
      set({
        downloadEstimate: estimate,
        isEstimating: false,
      });
    } catch (error) {
      logger.warn('offline', 'Failed to estimate region download', error);
      set({ isEstimating: false });
    }
  },

  startRegionDownload: async (region) => {
    const abortController = new AbortController();
    const { boundingBox } = region;

    // Calculate center and approximate radius from bounding box
    const centerLat = (boundingBox.north + boundingBox.south) / 2;
    const centerLon = (boundingBox.east + boundingBox.west) / 2;

    // Calculate approximate radius (half of the diagonal)
    const latDiff = boundingBox.north - boundingBox.south;
    const lonDiff = boundingBox.east - boundingBox.west;
    const latKm = latDiff * 111;
    const lonKm = lonDiff * 111 * Math.cos((centerLat * Math.PI) / 180);
    const radiusKm = Math.sqrt(latKm * latKm + lonKm * lonKm) / 2;

    set({
      isDownloading: true,
      error: null,
      showPrompt: false,
      currentDownload: {
        regionName: region.displayName,
        progress: {
          phase: 'estimating',
          currentPOIs: 0,
          totalPOIs: 0,
          percentage: 0,
          currentTile: 0,
          totalTiles: 0,
          message: `Preparing download for ${region.displayName}...`,
        },
        abortController,
      },
    });

    try {
      const result = await downloadPOIsForArea({
        centerLat,
        centerLon,
        radiusKm: Math.min(radiusKm, 200), // Cap at 200km to prevent massive downloads
        categories: ALL_POI_CATEGORIES,
        regionName: region.displayName,
        boundingBox: region.boundingBox, // Pass bounding box for more accurate download
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

      // Reload regions after successful download
      await get().loadDownloadedRegions();

      set({
        isDownloading: false,
        currentDownload: null,
        currentRegion: null,
        downloadCompletedRegion: region, // Signal download complete for auto-pan
        lastDownloadCompletedAt: Date.now(), // Cooldown to prevent immediate re-prompt
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
        logger.error('offline', 'Region download failed', error);
      }

      return null;
    }
  },
}));

/**
 * Calculate distance between two points in km (simplified)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
