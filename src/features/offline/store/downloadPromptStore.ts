/**
 * Download Prompt Store
 * Manages UI state for download prompts and dismissals
 */

import { create } from 'zustand';
import {
  DownloadEstimate,
  estimateDownload,
  estimateDownloadForBounds,
  shouldPromptForDownload,
} from '../services/poiDownload.service';
import {
  RegionInfo,
  detectCurrentRegion,
} from '../services/regionDetection.service';
import { logger } from '../../../shared/utils';
import { ALL_POI_CATEGORIES } from './downloadProgressStore';

// Radius configuration
export const RADIUS_MIN = 10; // Minimum radius in km
export const RADIUS_MAX = 200; // Maximum radius in km
export const RADIUS_STEP = 5; // Step size for slider
export const RADIUS_PRESETS = [25, 50, 100] as const; // Quick preset options
export const RADIUS_DEFAULT = 50; // Default radius

// Legacy export for backwards compatibility
export const RADIUS_OPTIONS = RADIUS_PRESETS;

// Now accepts any number within range (was constrained to union type)
export type RadiusOption = number;

// TODO: Add storage persistence for radius when @react-native-async-storage/async-storage is available

interface DismissedArea {
  lat: number;
  lon: number;
  dismissedAt: Date;
}

interface DownloadPromptState {
  // Prompt visibility
  showPrompt: boolean;
  promptLocation: { lat: number; lon: number } | null;

  // Radius-based (legacy)
  selectedRadius: RadiusOption;

  // Region-based
  currentRegion: RegionInfo | null;
  isDetectingRegion: boolean;

  // Estimate
  downloadEstimate: DownloadEstimate | null;
  isEstimating: boolean;

  // Dismissal tracking
  dismissedAreas: DismissedArea[];
  dismissedRegions: string[];

  // Download completion tracking (for auto-pan)
  downloadCompletedRegion: RegionInfo | null;
  lastDownloadCompletedAt: number | null;

  // Actions - Prompt control
  showDownloadPrompt: (lat: number, lon: number) => void;
  showRegionDownloadPrompt: (region: RegionInfo) => void;
  hideDownloadPrompt: () => void;

  // Actions - Radius
  setSelectedRadius: (radius: RadiusOption) => void;
  updateEstimate: (lat: number, lon: number, radius: RadiusOption) => Promise<void>;
  updateRegionEstimate: (region: RegionInfo) => Promise<void>;

  // Actions - Dismissal
  dismissPromptForArea: (lat: number, lon: number) => void;
  dismissRegion: (regionName: string) => void;
  undismissRegion: (regionName: string) => void;

  // Actions - Check if should prompt
  checkShouldPrompt: (lat: number, lon: number, isDownloading: boolean) => Promise<boolean>;
  checkShouldPromptForRegion: (
    lat: number,
    lon: number,
    isDownloading: boolean,
    downloadedRegionNames: string[]
  ) => Promise<{ shouldPrompt: boolean; region: RegionInfo | null }>;

  // Actions - Completion
  setDownloadCompleted: (region: RegionInfo) => void;
  clearDownloadCompletedRegion: () => void;

  // Actions - Initialization
  initializeRadius: () => Promise<void>;
}

// How long to remember dismissed areas (24 hours)
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

// Cooldown after download completion (5 seconds)
const DOWNLOAD_COOLDOWN_MS = 5000;

/**
 * Calculate distance between two points in km
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

export const useDownloadPromptStore = create<DownloadPromptState>((set, get) => ({
  showPrompt: false,
  promptLocation: null,
  selectedRadius: 50,
  currentRegion: null,
  isDetectingRegion: false,
  downloadEstimate: null,
  isEstimating: false,
  dismissedAreas: [],
  dismissedRegions: [],
  downloadCompletedRegion: null,
  lastDownloadCompletedAt: null,

  showDownloadPrompt: (lat, lon) => {
    const { selectedRadius } = get();
    set({
      showPrompt: true,
      promptLocation: { lat, lon },
    });
    get().updateEstimate(lat, lon, selectedRadius);
  },

  showRegionDownloadPrompt: (region) => {
    logger.info('offline', '[DEBUG] showRegionDownloadPrompt called', {
      region: region.displayName,
    });
    set({
      showPrompt: true,
      currentRegion: region,
      promptLocation: {
        lat: (region.boundingBox.north + region.boundingBox.south) / 2,
        lon: (region.boundingBox.east + region.boundingBox.west) / 2,
      },
    });
    get().updateRegionEstimate(region);
  },

  hideDownloadPrompt: () => {
    set({
      showPrompt: false,
      promptLocation: null,
      downloadEstimate: null,
    });
  },

  setSelectedRadius: (radius) => {
    // Clamp radius to valid range
    const clampedRadius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, radius));
    const { promptLocation } = get();
    set({ selectedRadius: clampedRadius });

    if (promptLocation) {
      get().updateEstimate(promptLocation.lat, promptLocation.lon, clampedRadius);
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

  undismissRegion: (regionName) => {
    const { dismissedRegions } = get();
    set({
      dismissedRegions: dismissedRegions.filter((name) => name !== regionName),
    });
  },

  checkShouldPrompt: async (lat, lon, isDownloading) => {
    const { dismissedAreas } = get();

    if (isDownloading) return false;

    // Check and clean up old dismissals
    const now = new Date();
    const recentDismissals = dismissedAreas.filter(
      (area) => now.getTime() - area.dismissedAt.getTime() < DISMISS_DURATION_MS
    );

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

    return shouldPromptForDownload(lat, lon, 20);
  },

  checkShouldPromptForRegion: async (lat, lon, isDownloading, downloadedRegionNames) => {
    const { dismissedRegions, isDetectingRegion, lastDownloadCompletedAt } = get();

    if (isDownloading || isDetectingRegion) {
      return { shouldPrompt: false, region: null };
    }

    // Cooldown check
    if (lastDownloadCompletedAt && (Date.now() - lastDownloadCompletedAt) < DOWNLOAD_COOLDOWN_MS) {
      return { shouldPrompt: false, region: null };
    }

    set({ isDetectingRegion: true });

    try {
      const region = await detectCurrentRegion(lat, lon);

      if (!region) {
        set({ isDetectingRegion: false });
        return { shouldPrompt: false, region: null };
      }

      // Check if region was dismissed
      if (dismissedRegions.includes(region.displayName)) {
        set({ isDetectingRegion: false, currentRegion: region });
        return { shouldPrompt: false, region };
      }

      // Check if region is already downloaded with sufficient POIs
      const MIN_POIS_FOR_VALID_DOWNLOAD = 10;
      const isAlreadyDownloaded = downloadedRegionNames.some(
        (name) => name === region.displayName || name === region.region
      );

      if (isAlreadyDownloaded) {
        set({ isDetectingRegion: false, currentRegion: region });
        return { shouldPrompt: false, region };
      }

      set({ isDetectingRegion: false, currentRegion: region });
      return { shouldPrompt: true, region };
    } catch (error) {
      logger.error('offline', 'Failed to check region', error);
      set({ isDetectingRegion: false });
      return { shouldPrompt: false, region: null };
    }
  },

  setDownloadCompleted: (region) => {
    set({
      downloadCompletedRegion: region,
      lastDownloadCompletedAt: Date.now(),
      currentRegion: null,
    });
  },

  clearDownloadCompletedRegion: () => {
    set({ downloadCompletedRegion: null });
  },

  initializeRadius: async () => {
    // TODO: Load persisted radius when storage is available
    // For now, uses default value from state initialization
  },
}));
