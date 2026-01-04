// Offline Maps Feature
export { OfflineManager } from './components/OfflineManager';
export { useOfflineStore } from './store/offlineStore';
export {
  downloadOfflineRegion,
  getOfflineRegions,
  deleteOfflineRegion,
  resetOfflineDatabase,
  calculateRouteBounds,
  estimateDownloadSize,
  formatBytes,
  type OfflineRegion,
  type OfflinePack,
  type OfflinePackStatus,
} from './services/offlineMap.service';

// POI Download - New focused stores
export { useDownloadProgressStore } from './store/downloadProgressStore';
export { useDownloadPromptStore, RADIUS_OPTIONS } from './store/downloadPromptStore';
export type { RadiusOption } from './store/downloadPromptStore';
export { useDownloadedRegionsStore } from './store/downloadedRegionsStore';

// POI Download - Composition hook (recommended)
export { usePOIDownload } from './hooks/usePOIDownload';

// Legacy re-export for backwards compatibility
export { usePOIDownloadStore } from './store/poiDownloadStore';
