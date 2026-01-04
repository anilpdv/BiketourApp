/**
 * Download Phase Utilities
 * Shared configuration and helpers for download progress UI
 */

import { colors } from '../design/tokens';

/**
 * Download phases for POI offline download
 */
export type DownloadPhase =
  | 'estimating'
  | 'downloading'
  | 'saving'
  | 'complete'
  | 'cancelled'
  | 'error';

/**
 * Configuration for each download phase
 */
export interface PhaseConfig {
  icon: string;
  color: string;
  title: string;
  statusText: string;
}

/**
 * Phase configuration map
 */
export const DOWNLOAD_PHASE_CONFIG: Record<DownloadPhase, PhaseConfig> = {
  estimating: {
    icon: 'timer-sand',
    color: colors.primary[500],
    title: 'Preparing...',
    statusText: 'Getting ready...',
  },
  downloading: {
    icon: 'cloud-download',
    color: colors.primary[500],
    title: 'Downloading',
    statusText: 'Fetching data...',
  },
  saving: {
    icon: 'database',
    color: colors.primary[500],
    title: 'Saving',
    statusText: 'Saving to device...',
  },
  complete: {
    icon: 'check-circle',
    color: colors.status.success,
    title: 'Download Complete',
    statusText: 'Saved',
  },
  cancelled: {
    icon: 'close-circle',
    color: colors.neutral[500],
    title: 'Cancelled',
    statusText: 'Download cancelled',
  },
  error: {
    icon: 'alert-circle',
    color: colors.status.error,
    title: 'Download Failed',
    statusText: 'Download failed',
  },
};

/**
 * Get configuration for a download phase
 */
export function getPhaseConfig(phase: DownloadPhase): PhaseConfig {
  return DOWNLOAD_PHASE_CONFIG[phase] ?? DOWNLOAD_PHASE_CONFIG.downloading;
}

/**
 * Get the icon name for a download phase
 */
export function getPhaseIcon(phase: DownloadPhase): string {
  return getPhaseConfig(phase).icon;
}

/**
 * Get the color for a download phase
 */
export function getPhaseColor(phase: DownloadPhase): string {
  return getPhaseConfig(phase).color;
}

/**
 * Check if a phase represents a finished state
 */
export function isPhaseFinished(phase: DownloadPhase): boolean {
  return phase === 'complete' || phase === 'cancelled' || phase === 'error';
}

/**
 * Format download status text with dynamic values
 */
export function formatStatusText(
  phase: DownloadPhase,
  currentTile?: number,
  totalTiles?: number,
  currentPOIs?: number
): string {
  const config = getPhaseConfig(phase);

  switch (phase) {
    case 'downloading':
      // Show tile progress for multi-tile downloads
      if (currentTile !== undefined && totalTiles !== undefined && totalTiles > 1) {
        return `Downloading (${currentTile}/${totalTiles} areas)`;
      }
      // Show POI count when available
      if (currentPOIs !== undefined && currentPOIs > 0) {
        return `Downloading... ${currentPOIs.toLocaleString()} POIs`;
      }
      return 'Downloading...';
    case 'saving':
      if (currentPOIs !== undefined && currentPOIs > 0) {
        return `Saving ${currentPOIs.toLocaleString()} POIs...`;
      }
      return config.statusText;
    case 'complete':
      if (currentPOIs !== undefined) {
        return `${currentPOIs.toLocaleString()} POIs saved`;
      }
      return config.statusText;
    default:
      return config.statusText;
  }
}
