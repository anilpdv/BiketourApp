/**
 * POI Download Progress
 * Bottom sheet showing download progress
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
  onComplete?: () => void;
}

export const POIDownloadProgress = memo(function POIDownloadProgress({
  visible,
  onComplete,
}: POIDownloadProgressProps) {
  const { currentDownload, cancelDownload } = usePOIDownloadStore();

  if (!currentDownload) return null;

  const { progress } = currentDownload;
  const phase = progress.phase as DownloadPhase;
  const isFinished = isPhaseFinished(phase);
  const phaseConfig = getPhaseConfig(phase);

  const statusText = formatStatusText(
    phase,
    progress.currentTile,
    progress.totalTiles,
    progress.currentPOIs
  );

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

            {/* Progress bar */}
            {!isFinished && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      { width: `${progress.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress.percentage}%</Text>
              </View>
            )}

            {/* POI count */}
            {progress.currentPOIs > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="map-marker-multiple"
                    size={20}
                    color={colors.neutral[600]}
                  />
                  <Text style={styles.statValue}>
                    {progress.currentPOIs.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>POIs</Text>
                </View>
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
                  onPress={cancelDownload}
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
  progressText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    minWidth: 45,
    textAlign: 'right',
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
