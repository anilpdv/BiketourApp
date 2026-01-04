/**
 * POI Download Composition Hook
 * Provides a unified interface for POI download functionality
 * by composing the focused stores
 */

import { useCallback, useEffect } from 'react';
import { useDownloadProgressStore, CurrentDownload } from '../store/downloadProgressStore';
import { useDownloadPromptStore, RadiusOption, RADIUS_OPTIONS } from '../store/downloadPromptStore';
import { useDownloadedRegionsStore } from '../store/downloadedRegionsStore';
import { RegionInfo } from '../services/regionDetection.service';
import { DownloadResult, DownloadedRegion, DownloadEstimate } from '../services/poiDownload.service';

export { RADIUS_OPTIONS };
export type { RadiusOption };

export interface UsePOIDownloadReturn {
  // Downloaded regions
  downloadedRegions: DownloadedRegion[];
  isLoadingRegions: boolean;
  totalPOIs: number;
  totalSizeBytes: number;

  // Current download
  isDownloading: boolean;
  currentDownload: CurrentDownload | null;

  // Prompt state
  showPrompt: boolean;
  promptLocation: { lat: number; lon: number } | null;
  selectedRadius: RadiusOption;
  downloadEstimate: DownloadEstimate | null;
  isEstimating: boolean;

  // Region state
  currentRegion: RegionInfo | null;
  isDetectingRegion: boolean;
  downloadCompletedRegion: RegionInfo | null;

  // Error
  error: string | null;

  // Actions - Regions
  loadDownloadedRegions: () => Promise<void>;
  deleteRegion: (regionId: string) => Promise<void>;

  // Actions - Download
  startDownload: (
    centerLat: number,
    centerLon: number,
    radiusKm: RadiusOption,
    regionName?: string
  ) => Promise<DownloadResult | null>;
  startRegionDownload: (region: RegionInfo) => Promise<DownloadResult | null>;
  cancelDownload: () => void;

  // Actions - Prompt (legacy radius-based)
  checkShouldPrompt: (lat: number, lon: number) => Promise<boolean>;
  showDownloadPrompt: (lat: number, lon: number) => void;
  hideDownloadPrompt: () => void;
  dismissPromptForArea: (lat: number, lon: number) => void;
  setSelectedRadius: (radius: RadiusOption) => void;
  updateEstimate: (lat: number, lon: number, radius: RadiusOption) => Promise<void>;

  // Actions - Region-based prompt
  checkShouldPromptForRegion: (lat: number, lon: number) => Promise<{
    shouldPrompt: boolean;
    region: RegionInfo | null;
  }>;
  showRegionDownloadPrompt: (region: RegionInfo) => void;
  dismissRegion: (regionName: string) => void;

  // Actions - Utility
  clearError: () => void;
  clearDownloadCompletedRegion: () => void;
  loadStats: () => Promise<void>;
}

/**
 * Unified hook for POI download functionality
 * Composes downloadProgressStore, downloadPromptStore, and downloadedRegionsStore
 */
export function usePOIDownload(): UsePOIDownloadReturn {
  // Progress store
  const isDownloading = useDownloadProgressStore((s) => s.isDownloading);
  const currentDownload = useDownloadProgressStore((s) => s.currentDownload);
  const progressError = useDownloadProgressStore((s) => s.error);
  const startDownloadAction = useDownloadProgressStore((s) => s.startDownload);
  const startRegionDownloadAction = useDownloadProgressStore((s) => s.startRegionDownload);
  const cancelDownload = useDownloadProgressStore((s) => s.cancelDownload);
  const clearProgressError = useDownloadProgressStore((s) => s.clearError);
  const setOnDownloadComplete = useDownloadProgressStore((s) => s.setOnDownloadComplete);

  // Prompt store
  const showPrompt = useDownloadPromptStore((s) => s.showPrompt);
  const promptLocation = useDownloadPromptStore((s) => s.promptLocation);
  const selectedRadius = useDownloadPromptStore((s) => s.selectedRadius);
  const currentRegion = useDownloadPromptStore((s) => s.currentRegion);
  const isDetectingRegion = useDownloadPromptStore((s) => s.isDetectingRegion);
  const downloadEstimate = useDownloadPromptStore((s) => s.downloadEstimate);
  const isEstimating = useDownloadPromptStore((s) => s.isEstimating);
  const downloadCompletedRegion = useDownloadPromptStore((s) => s.downloadCompletedRegion);
  const showDownloadPrompt = useDownloadPromptStore((s) => s.showDownloadPrompt);
  const showRegionDownloadPromptAction = useDownloadPromptStore((s) => s.showRegionDownloadPrompt);
  const hideDownloadPrompt = useDownloadPromptStore((s) => s.hideDownloadPrompt);
  const dismissPromptForArea = useDownloadPromptStore((s) => s.dismissPromptForArea);
  const dismissRegion = useDownloadPromptStore((s) => s.dismissRegion);
  const setSelectedRadius = useDownloadPromptStore((s) => s.setSelectedRadius);
  const updateEstimate = useDownloadPromptStore((s) => s.updateEstimate);
  const checkShouldPromptAction = useDownloadPromptStore((s) => s.checkShouldPrompt);
  const checkShouldPromptForRegionAction = useDownloadPromptStore((s) => s.checkShouldPromptForRegion);
  const setDownloadCompleted = useDownloadPromptStore((s) => s.setDownloadCompleted);
  const clearDownloadCompletedRegion = useDownloadPromptStore((s) => s.clearDownloadCompletedRegion);

  // Regions store
  const downloadedRegions = useDownloadedRegionsStore((s) => s.downloadedRegions);
  const isLoadingRegions = useDownloadedRegionsStore((s) => s.isLoadingRegions);
  const totalPOIs = useDownloadedRegionsStore((s) => s.totalPOIs);
  const totalSizeBytes = useDownloadedRegionsStore((s) => s.totalSizeBytes);
  const regionsError = useDownloadedRegionsStore((s) => s.error);
  const loadDownloadedRegions = useDownloadedRegionsStore((s) => s.loadDownloadedRegions);
  const deleteRegion = useDownloadedRegionsStore((s) => s.deleteRegion);
  const loadStats = useDownloadedRegionsStore((s) => s.loadStats);
  const clearRegionsError = useDownloadedRegionsStore((s) => s.clearError);
  const getRegionNames = useDownloadedRegionsStore((s) => s.getRegionNames);

  // Set up download completion callback
  useEffect(() => {
    setOnDownloadComplete(async () => {
      await loadDownloadedRegions();
    });
  }, [setOnDownloadComplete, loadDownloadedRegions]);

  // Combined error
  const error = progressError || regionsError;

  // Wrapped actions to coordinate between stores
  const startDownload = useCallback(
    async (
      centerLat: number,
      centerLon: number,
      radiusKm: RadiusOption,
      regionName?: string
    ) => {
      hideDownloadPrompt();
      return startDownloadAction(centerLat, centerLon, radiusKm, regionName);
    },
    [hideDownloadPrompt, startDownloadAction]
  );

  const startRegionDownload = useCallback(
    async (region: RegionInfo) => {
      hideDownloadPrompt();
      // Small delay to ensure prompt animation completes before showing progress
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = await startRegionDownloadAction(region);
      if (result) {
        setDownloadCompleted(region);
      }
      return result;
    },
    [hideDownloadPrompt, startRegionDownloadAction, setDownloadCompleted]
  );

  const showRegionDownloadPrompt = useCallback(
    (region: RegionInfo) => {
      showRegionDownloadPromptAction(region);
    },
    [showRegionDownloadPromptAction]
  );

  const checkShouldPrompt = useCallback(
    async (lat: number, lon: number) => {
      return checkShouldPromptAction(lat, lon, isDownloading);
    },
    [checkShouldPromptAction, isDownloading]
  );

  const checkShouldPromptForRegion = useCallback(
    async (lat: number, lon: number) => {
      const regionNames = getRegionNames();
      return checkShouldPromptForRegionAction(lat, lon, isDownloading, regionNames);
    },
    [checkShouldPromptForRegionAction, isDownloading, getRegionNames]
  );

  const clearError = useCallback(() => {
    clearProgressError();
    clearRegionsError();
  }, [clearProgressError, clearRegionsError]);

  return {
    // Downloaded regions
    downloadedRegions,
    isLoadingRegions,
    totalPOIs,
    totalSizeBytes,

    // Current download
    isDownloading,
    currentDownload,

    // Prompt state
    showPrompt,
    promptLocation,
    selectedRadius,
    downloadEstimate,
    isEstimating,

    // Region state
    currentRegion,
    isDetectingRegion,
    downloadCompletedRegion,

    // Error
    error,

    // Actions
    loadDownloadedRegions,
    deleteRegion,
    startDownload,
    startRegionDownload,
    cancelDownload,
    checkShouldPrompt,
    showDownloadPrompt,
    hideDownloadPrompt,
    dismissPromptForArea,
    setSelectedRadius,
    updateEstimate,
    checkShouldPromptForRegion,
    showRegionDownloadPrompt,
    dismissRegion,
    clearError,
    clearDownloadCompletedRegion,
    loadStats,
  };
}

// Re-export for backwards compatibility
export { usePOIDownload as usePOIDownloadStore };
