/**
 * POI Download Prompt
 * Modal dialog for prompting users to download POIs for offline use
 * Supports both region-based (new) and radius-based (legacy) downloads
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePOIDownloadStore } from '../store/poiDownloadStore';
import { formatBytes } from '../services/poiDownload.service';
import { RegionInfo } from '../services/regionDetection.service';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../shared/design/tokens';

interface POIDownloadPromptProps {
  visible: boolean;
  region?: RegionInfo | null; // If provided, shows region-based UI
  onClose: () => void;
  onDownload: () => void;
}

export const POIDownloadPrompt = memo(function POIDownloadPrompt({
  visible,
  region,
  onClose,
  onDownload,
}: POIDownloadPromptProps) {
  const {
    downloadEstimate,
    isEstimating,
  } = usePOIDownloadStore();

  const handleDismiss = () => {
    onClose();
  };

  const handleDownload = () => {
    onDownload();
  };

  // Format region display name nicely
  const regionDisplayName = region?.region || 'this area';
  const countryName = region?.country || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={28}
                color={colors.primary[500]}
              />
            </View>
            {region ? (
              <>
                <Text style={styles.title}>Download POIs for</Text>
                <Text style={styles.regionName}>{regionDisplayName}</Text>
                {countryName && (
                  <Text style={styles.countryName}>{countryName}</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.title}>Download POIs for this area?</Text>
                <Text style={styles.subtitle}>
                  Save points of interest for offline access
                </Text>
              </>
            )}
          </View>

          {/* Includes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Includes</Text>
            <View style={styles.categoriesRow}>
              <CategoryBadge icon="tent" label="Campsites" />
              <CategoryBadge icon="bicycle" label="Bike shops" />
              <CategoryBadge icon="water" label="Water" />
              <CategoryBadge icon="silverware-fork-knife" label="Food" />
            </View>
            <Text style={styles.moreText}>+ 14 more categories</Text>
          </View>

          {/* Estimate */}
          <View style={styles.estimateContainer}>
            {isEstimating ? (
              <View style={styles.estimateLoading}>
                <ActivityIndicator size="small" color={colors.primary[500]} />
                <Text style={styles.estimateLoadingText}>Estimating...</Text>
              </View>
            ) : downloadEstimate ? (
              <View style={styles.estimateRow}>
                <View style={styles.estimateItem}>
                  <Text style={styles.estimateValue}>
                    ~{downloadEstimate.estimatedPOIs.toLocaleString()}
                  </Text>
                  <Text style={styles.estimateLabel}>POIs</Text>
                </View>
                <View style={styles.estimateDivider} />
                <View style={styles.estimateItem}>
                  <Text style={styles.estimateValue}>
                    ~{formatBytes(downloadEstimate.estimatedSizeBytes)}
                  </Text>
                  <Text style={styles.estimateLabel}>Size</Text>
                </View>
              </View>
            ) : (
              <View style={styles.estimateLoading}>
                <Text style={styles.estimateLoadingText}>Calculating size...</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonSecondaryText}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleDownload}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="download"
                size={18}
                color={colors.neutral[0]}
              />
              <Text style={styles.buttonPrimaryText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

interface CategoryBadgeProps {
  icon: string;
  label: string;
}

const CategoryBadge = memo(function CategoryBadge({ icon, label }: CategoryBadgeProps) {
  return (
    <View style={styles.categoryBadge}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={colors.neutral[600]}
      />
      <Text style={styles.categoryBadgeText}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 360,
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  regionName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[600],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  countryName: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  categoryBadgeText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[700],
  },
  moreText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.sm,
  },
  estimateContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  estimateLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  estimateLoadingText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateItem: {
    alignItems: 'center',
    flex: 1,
  },
  estimateValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  estimateLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  estimateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[300],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  buttonPrimaryText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
});

export default POIDownloadPrompt;
