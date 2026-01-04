import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { getPOITerrain, hasTerrain, isCampingCategory, POITerrain as POITerrainType } from '../../utils/poiTagParser';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POITerrainProps {
  poi: POI;
}

/**
 * Section showing terrain/capacity info for camping POIs
 * Displays max stay, capacity, vehicle limits, surface type, and fees
 */
export const POITerrain = memo(function POITerrain({ poi }: POITerrainProps) {
  const terrain = useMemo(() => getPOITerrain(poi), [poi]);

  // Only show for camping-type POIs and if there's terrain data
  if (!isCampingCategory(poi.category) || !hasTerrain(terrain)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="terrain"
          size={20}
          color={colors.primary[500]}
          style={styles.headerIcon}
        />
        <Text style={styles.headerText}>Site Info</Text>
      </View>
      <View style={styles.infoGrid}>
        {terrain.capacity !== undefined && (
          <TerrainInfoItem
            icon="tent"
            label="Capacity"
            value={`${terrain.capacity} spots`}
          />
        )}
        {terrain.maxStay && (
          <TerrainInfoItem
            icon="clock-outline"
            label="Max stay"
            value={terrain.maxStay}
          />
        )}
        {terrain.maxLength && (
          <TerrainInfoItem
            icon="ruler"
            label="Max length"
            value={terrain.maxLength}
          />
        )}
        {terrain.maxWidth && (
          <TerrainInfoItem
            icon="arrow-expand-horizontal"
            label="Max width"
            value={terrain.maxWidth}
          />
        )}
        {terrain.surface && (
          <TerrainInfoItem
            icon="texture-box"
            label="Surface"
            value={formatSurface(terrain.surface)}
          />
        )}
        {terrain.fee && (
          <TerrainInfoItem
            icon="currency-eur"
            label="Fee"
            value={formatFee(terrain.fee, terrain.feeAmount)}
            highlight
          />
        )}
      </View>
    </View>
  );
});

/**
 * Individual terrain info item
 */
const TerrainInfoItem = memo(function TerrainInfoItem({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.infoItem, highlight && styles.infoItemHighlight]}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={highlight ? colors.status.warning : colors.neutral[500]}
      />
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
          {value}
        </Text>
      </View>
    </View>
  );
});

/**
 * Format surface type for display
 */
function formatSurface(surface: string): string {
  const surfaceLabels: Record<string, string> = {
    grass: 'Grass',
    gravel: 'Gravel',
    paved: 'Paved',
    asphalt: 'Asphalt',
    concrete: 'Concrete',
    dirt: 'Dirt/Earth',
    sand: 'Sand',
    ground: 'Natural ground',
  };
  return surfaceLabels[surface.toLowerCase()] || surface;
}

/**
 * Format fee for display
 */
function formatFee(feeTag: string, feeAmount?: number): string {
  if (feeTag === 'yes' && feeAmount) {
    return `${feeAmount.toFixed(2)}/night`;
  }
  if (feeTag === 'yes') {
    return 'Yes';
  }
  if (feeTag === 'no') {
    return 'Free';
  }
  return feeTag;
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoItemHighlight: {
    backgroundColor: colors.status.warning + '10',
    borderWidth: 1,
    borderColor: colors.status.warning + '30',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  infoValueHighlight: {
    color: colors.status.warning,
  },
});
