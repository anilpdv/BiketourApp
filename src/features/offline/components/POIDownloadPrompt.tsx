/**
 * POI Download Prompt
 * Modal dialog for prompting users to download POIs and map tiles for offline use
 * Supports both region-based (new) and radius-based (legacy) downloads
 */

import React, { memo, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePOIDownloadStore } from '../store/poiDownloadStore';
import { formatBytes } from '../services/poiDownload.service';
import { RegionInfo } from '../services/regionDetection.service';
import { RADIUS_PRESETS } from '../store/downloadPromptStore';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';
import { estimateTileDownload, formatTileSize } from '../services/tileEstimation.service';
import { OFFLINE_RASTER_STYLES, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM } from '../types/tiles';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../shared/design/tokens';

// Style display names for UI
const STYLE_DISPLAY_NAMES: Record<string, string> = {
  cyclosm: 'CyclOSM (Cycling)',
  satellite: 'Satellite',
  topo: 'Topographic',
};

interface POIDownloadPromptProps {
  visible: boolean;
  region?: RegionInfo | null; // If provided, shows region-based UI
  currentMapStyle?: MapStyleKey; // Current map style for tile download
  onClose: () => void;
  onDownload: (options: { downloadPOIs: boolean; downloadTiles: boolean }) => void;
}

export const POIDownloadPrompt = memo(function POIDownloadPrompt({
  visible,
  region,
  currentMapStyle = 'cyclosm',
  onClose,
  onDownload,
}: POIDownloadPromptProps) {
  const {
    downloadEstimate,
    isEstimating,
    selectedRadius,
    setSelectedRadius,
  } = usePOIDownloadStore();

  // Download options state
  const [downloadPOIs, setDownloadPOIs] = useState(true);
  const [downloadTiles, setDownloadTiles] = useState(false);

  // Debounce state to prevent double-tap on download button
  const [isStarting, setIsStarting] = useState(false);

  // Calculate tile estimate when region changes
  const tileEstimate = useMemo(() => {
    if (!region?.boundingBox) return null;

    // Only show tile option for supported raster styles
    if (!OFFLINE_RASTER_STYLES.includes(currentMapStyle as any)) {
      return null;
    }

    return estimateTileDownload(
      region.boundingBox,
      currentMapStyle,
      DEFAULT_MIN_ZOOM,
      DEFAULT_MAX_ZOOM
    );
  }, [region?.boundingBox, currentMapStyle]);

  // Calculate combined total size
  const totalEstimatedSize = useMemo(() => {
    let total = 0;
    if (downloadPOIs && downloadEstimate) {
      total += downloadEstimate.estimatedSizeBytes;
    }
    if (downloadTiles && tileEstimate) {
      total += tileEstimate.estimatedSizeBytes;
    }
    return total;
  }, [downloadPOIs, downloadTiles, downloadEstimate, tileEstimate]);

  // Check if download button should be enabled
  const canDownload = downloadPOIs || downloadTiles;

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsStarting(false);
      setDownloadTiles(false);
    }
  }, [visible]);

  const handleDismiss = () => {
    onClose();
  };

  const handleDownload = () => {
    // Prevent double-tap
    if (isStarting || !canDownload) return;
    setIsStarting(true);
    onDownload({ downloadPOIs, downloadTiles });
    // Note: Don't reset isStarting - modal will unmount after download starts
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
                <Text style={styles.title}>Save for offline</Text>
                <Text style={styles.regionName}>{regionDisplayName}</Text>
                {countryName && (
                  <Text style={styles.countryName}>{countryName}</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.title}>Save this area offline?</Text>
                <Text style={styles.subtitle}>
                  Download POIs and map tiles for offline access
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

          {/* Radius Selection - only show for non-region downloads */}
          {!region && (
            <View style={styles.section}>
              <View style={styles.radiusHeader}>
                <Text style={styles.sectionLabel}>Download Radius</Text>
                <Text style={styles.radiusValue}>{selectedRadius} km</Text>
              </View>
              <View style={styles.radiusChipsContainer}>
                {RADIUS_PRESETS.map((preset) => {
                  const isSelected = selectedRadius === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.radiusChip, isSelected && styles.radiusChipSelected]}
                      onPress={() => setSelectedRadius(preset)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.radiusChipText, isSelected && styles.radiusChipTextSelected]}>
                        {preset} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Download Options */}
          <View style={styles.optionsSection}>
            {/* POIs Option */}
            <TouchableOpacity
              style={[styles.optionRow, downloadPOIs && styles.optionRowSelected]}
              onPress={() => setDownloadPOIs(!downloadPOIs)}
              activeOpacity={0.7}
            >
              <View style={styles.optionCheckbox}>
                <MaterialCommunityIcons
                  name={downloadPOIs ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={downloadPOIs ? colors.primary[500] : colors.neutral[400]}
                />
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <MaterialCommunityIcons
                    name="map-marker-multiple"
                    size={18}
                    color={downloadPOIs ? colors.primary[600] : colors.neutral[600]}
                  />
                  <Text style={[styles.optionTitle, downloadPOIs && styles.optionTitleSelected]}>
                    Download POIs
                  </Text>
                </View>
                {isEstimating ? (
                  <Text style={styles.optionEstimate}>Estimating...</Text>
                ) : downloadEstimate ? (
                  <Text style={styles.optionEstimate}>
                    ~{downloadEstimate.estimatedPOIs.toLocaleString()} POIs ({formatBytes(downloadEstimate.estimatedSizeBytes)})
                  </Text>
                ) : (
                  <Text style={styles.optionEstimate}>Calculating...</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Map Tiles Option (only for supported styles) */}
            {tileEstimate && (
              <TouchableOpacity
                style={[styles.optionRow, downloadTiles && styles.optionRowSelected]}
                onPress={() => setDownloadTiles(!downloadTiles)}
                activeOpacity={0.7}
              >
                <View style={styles.optionCheckbox}>
                  <MaterialCommunityIcons
                    name={downloadTiles ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={downloadTiles ? colors.primary[500] : colors.neutral[400]}
                  />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <MaterialCommunityIcons
                      name="map"
                      size={18}
                      color={downloadTiles ? colors.primary[600] : colors.neutral[600]}
                    />
                    <Text style={[styles.optionTitle, downloadTiles && styles.optionTitleSelected]}>
                      Download Map Tiles
                    </Text>
                  </View>
                  <Text style={styles.optionEstimate}>
                    ~{tileEstimate.tileCount.toLocaleString()} tiles ({formatTileSize(tileEstimate.estimatedSizeBytes)})
                  </Text>
                  <Text style={styles.optionSubtext}>
                    {STYLE_DISPLAY_NAMES[currentMapStyle] || currentMapStyle} • Zoom {DEFAULT_MIN_ZOOM}-{DEFAULT_MAX_ZOOM}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Total Estimate */}
          {(downloadPOIs || downloadTiles) && totalEstimatedSize > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total download size:</Text>
              <Text style={styles.totalValue}>~{formatTileSize(totalEstimatedSize)}</Text>
            </View>
          )}

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
              style={[styles.buttonPrimary, (isStarting || !canDownload) && styles.buttonDisabled]}
              onPress={handleDownload}
              activeOpacity={0.7}
              disabled={isStarting || !canDownload}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <MaterialCommunityIcons
                  name="download"
                  size={18}
                  color={colors.neutral[0]}
                />
              )}
              <Text style={styles.buttonPrimaryText}>
                {isStarting ? 'Starting...' : 'Download'}
              </Text>
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
        name={icon as any}
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
  optionsSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  optionRowSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  optionCheckbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  optionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  optionTitleSelected: {
    color: colors.primary[700],
  },
  optionEstimate: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
  },
  optionSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  totalLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
  totalValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
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
  buttonDisabled: {
    opacity: 0.7,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  radiusValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[600],
  },
  radiusChipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  radiusChipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  radiusChipText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  radiusChipTextSelected: {
    color: colors.primary[700],
  },
});

export default POIDownloadPrompt;
