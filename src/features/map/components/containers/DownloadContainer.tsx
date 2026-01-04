/**
 * Download Container
 * Manages POI download prompt and progress UI
 */

import React, { useCallback, useEffect } from 'react';
import { usePOIDownload } from '../../../offline/hooks/usePOIDownload';
import { POIDownloadPrompt } from '../../../offline/components/POIDownloadPrompt';
import { POIDownloadProgress } from '../../../offline/components/POIDownloadProgress';

interface DownloadContainerProps {
  mapCenter: { lat: number; lon: number } | null;
  isFiltersModalVisible: boolean;
  onDownloadComplete?: (region: { boundingBox: { north: number; south: number; east: number; west: number }; displayName: string }) => void;
}

export function DownloadContainer({
  mapCenter,
  isFiltersModalVisible,
  onDownloadComplete,
}: DownloadContainerProps) {
  const {
    showPrompt,
    isDownloading,
    currentRegion,
    downloadCompletedRegion,
    checkShouldPromptForRegion,
    showRegionDownloadPrompt,
    hideDownloadPrompt,
    dismissRegion,
    startRegionDownload,
    loadDownloadedRegions,
    clearDownloadCompletedRegion,
  } = usePOIDownload();

  // Load downloaded regions on mount
  useEffect(() => {
    loadDownloadedRegions();
  }, [loadDownloadedRegions]);

  // Notify parent when download completes
  useEffect(() => {
    if (downloadCompletedRegion && onDownloadComplete) {
      onDownloadComplete(downloadCompletedRegion);
      clearDownloadCompletedRegion();
    }
  }, [downloadCompletedRegion, onDownloadComplete, clearDownloadCompletedRegion]);

  // Auto-prompt for POI download when viewing new region
  useEffect(() => {
    if (!mapCenter) return;

    let timer: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const checkAndPrompt = async () => {
      timer = setTimeout(async () => {
        if (isCancelled) return;

        // Don't show download prompt if another modal is already open
        if (isFiltersModalVisible) return;

        const result = await checkShouldPromptForRegion(mapCenter.lat, mapCenter.lon);

        if (result.shouldPrompt && result.region) {
          showRegionDownloadPrompt(result.region);
        }
      }, 2000);
    };

    checkAndPrompt();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [mapCenter?.lat, mapCenter?.lon, checkShouldPromptForRegion, showRegionDownloadPrompt, isFiltersModalVisible]);

  // Handle POI download from prompt
  const handleStartDownload = useCallback(async () => {
    if (!currentRegion) return;
    await startRegionDownload(currentRegion);
  }, [currentRegion, startRegionDownload]);

  // Handle dismiss download prompt
  const handleDismiss = useCallback(() => {
    if (currentRegion) {
      dismissRegion(currentRegion.displayName);
    } else {
      hideDownloadPrompt();
    }
  }, [currentRegion, dismissRegion, hideDownloadPrompt]);

  const handleDownloadComplete = useCallback(() => {
    hideDownloadPrompt();
  }, [hideDownloadPrompt]);

  return (
    <>
      <POIDownloadPrompt
        visible={showPrompt}
        region={currentRegion}
        onClose={handleDismiss}
        onDownload={handleStartDownload}
      />
      <POIDownloadProgress
        visible={isDownloading}
        onComplete={handleDownloadComplete}
      />
    </>
  );
}
