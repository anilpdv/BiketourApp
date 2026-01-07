/**
 * POI Download Progress
 * Bottom sheet showing download progress for POIs and/or Map Tiles
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePOIDownloadStore } from '../store/poiDownloadStore';
import { useTileDownloadStore } from '../store/tileDownloadStore';
import { formatTileSize } from '../services/tileEstimation.service';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../shared/design/tokens';
import {
  getPhaseIcon,
  getPhaseColor,
  formatStatusText,
  isPhaseFinished,
  getPhaseConfig,
  DownloadPhase,
} from '../../../shared/utils';

interface POIDownloadProgressProps {
  visible: boolean;
  showTileProgress?: boolean; // Whether to also show tile download progress
  onComplete?: () => void;
}

export const POIDownloadProgress = memo(function POIDownloadProgress({
  visible,
  showTileProgress = false,
  onComplete,
}: POIDownloadProgressProps) {
  const { currentDownload, cancelDownload: cancelPOIDownload } = usePOIDownloadStore();
  const { currentTileDownload, cancelTileDownload, isDownloadingTiles } = useTileDownloadStore();

  // Determine if we have any active download
  const hasPOIDownload = !!currentDownload;
  const hasTileDownload = showTileProgress && !!currentTileDownload;

  if (!hasPOIDownload && !hasTileDownload) return null;

  // Get current active download info
  const poiProgress = currentDownload?.progress;
  const tileProgress = currentTileDownload?.progress;

  const poiPhase = poiProgress?.phase as DownloadPhase;
  const tilePhase = tileProgress?.phase;

  const isPOIError = poiPhase === 'error';
  const isPOIFinished = poiPhase ? isPhaseFinished(poiPhase) : true;
  const isTileFinished = tilePhase === 'complete' || tilePhase === 'error' || tilePhase === 'cancelled';

  // Overall status
  const isFinished = (!hasPOIDownload || isPOIFinished) && (!hasTileDownload || isTileFinished);
  const hasError = isPOIError || tilePhase === 'error';

  // Phase config for display - use error phase if there's an error
  const activePhase = hasError
    ? 'error'
    : hasPOIDownload && !isPOIFinished
    ? poiPhase
    : (hasTileDownload ? 'downloading' : 'complete');
  const phaseConfig = getPhaseConfig(activePhase as DownloadPhase);

  // Status text
  let statusText = '';
  if (isPOIError && poiProgress?.message) {
    // Show the error message from the download service
    statusText = poiProgress.message;
  } else if (hasPOIDownload && !isPOIFinished && poiProgress) {
    statusText = formatStatusText(
      poiPhase,
      poiProgress.currentTile,
      poiProgress.totalTiles,
      poiProgress.currentPOIs
    );
  } else if (hasTileDownload && !isTileFinished && tileProgress) {
    statusText = tileProgress.message || `Downloading tiles (zoom ${tileProgress.currentZoom})...`;
  } else {
    statusText = 'Download complete';
  }

  // Combined cancel
  const handleCancel = () => {
    if (hasPOIDownload && !isPOIFinished) {
      cancelPOIDownload();
    }
    if (hasTileDownload && !isTileFinished) {
      cancelTileDownload();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (isFinished) {
          onComplete?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: phaseConfig.color + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name={phaseConfig.icon as any}
                size={32}
                color={phaseConfig.color}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{phaseConfig.title}</Text>

            {/* Status */}
            <Text style={styles.statusText}>{statusText}</Text>

            {/* POI Progress */}
            {hasPOIDownload && poiProgress && (
              <View style={styles.downloadSection}>
                <View style={styles.downloadHeader}>
                  <MaterialCommunityIcons
                    name="map-marker-multiple"
                    size={18}
                    color={isPOIFinished ? colors.status.success : colors.primary[500]}
                  />
                  <Text style={styles.downloadLabel}>POIs</Text>
                  {isPOIFinished && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={colors.status.success}
                    />
                  )}
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        { width: `${poiProgress.percentage}%` },
                        isPOIFinished && styles.progressBarComplete,
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{poiProgress.percentage}%</Text>
                </View>
                {poiProgress.currentPOIs > 0 && (
                  <Text style={styles.downloadStats}>
                    {poiProgress.currentPOIs.toLocaleString()} POIs downloaded
                  </Text>
                )}
              </View>
            )}

            {/* Tile Progress */}
            {hasTileDownload && tileProgress && (
              <View style={styles.downloadSection}>
                <View style={styles.downloadHeader}>
                  <MaterialCommunityIcons
                    name="map"
                    size={18}
                    color={isTileFinished ? colors.status.success : colors.primary[500]}
                  />
                  <Text style={styles.downloadLabel}>Map Tiles</Text>
                  {isTileFinished && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={colors.status.success}
                    />
                  )}
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        { width: `${tileProgress.percentage}%` },
                        isTileFinished && styles.progressBarComplete,
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{tileProgress.percentage}%</Text>
                </View>
                <Text style={styles.downloadStats}>
                  {tileProgress.currentTile.toLocaleString()} / {tileProgress.totalTiles.toLocaleString()} tiles
                  {tileProgress.bytesDownloaded > 0 && ` (${formatTileSize(tileProgress.bytesDownloaded)})`}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {isFinished ? (
                <TouchableOpacity
                  style={styles.buttonPrimary}
                  onPress={onComplete}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonPrimaryText}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.buttonCancel}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={colors.status.error}
                  />
                  <Text style={styles.buttonCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['3xl'],
    ...shadows['2xl'],
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: colors.status.success,
  },
  progressText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    minWidth: 45,
    textAlign: 'right',
  },
  downloadSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  downloadLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    flex: 1,
  },
  downloadStats: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
  },
  actions: {
    width: '100%',
  },
  buttonPrimary: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonPrimaryText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
  buttonCancel: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.status.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCancelText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.status.error,
  },
});

export default POIDownloadProgress;
