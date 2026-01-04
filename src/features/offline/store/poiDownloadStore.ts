/**
 * POI Download Store
 * @deprecated Use usePOIDownload hook from '../hooks/usePOIDownload' instead.
 * This file re-exports for backwards compatibility.
 */

// Re-export everything from the new composition hook for backwards compatibility
export {
  usePOIDownload as usePOIDownloadStore,
  usePOIDownload,
  RADIUS_OPTIONS,
} from '../hooks/usePOIDownload';

export type { RadiusOption, UsePOIDownloadReturn } from '../hooks/usePOIDownload';
