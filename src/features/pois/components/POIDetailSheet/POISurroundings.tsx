import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { getPOISurroundings, POISurrounding, isCampingCategory } from '../../utils/poiTagParser';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POISurroundingsProps {
  poi: POI;
}

/**
 * Section showing nearby activities (cycling, hiking, swimming, etc.)
 * Only visible for camping-related POI categories
 */
export const POISurroundings = memo(function POISurroundings({ poi }: POISurroundingsProps) {
  const surroundings = useMemo(() => getPOISurroundings(poi), [poi]);

  // Only show for camping-type POIs and if there are surroundings
  if (!isCampingCategory(poi.category) || surroundings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="map-marker-radius"
          size={20}
          color={colors.primary[500]}
          style={styles.headerIcon}
        />
        <Text style={styles.headerText}>Surroundings</Text>
      </View>
      <View style={styles.itemsContainer}>
        {surroundings.map((item) => (
          <SurroundingItem key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
});

/**
 * Individual surrounding activity item
 */
const SurroundingItem = memo(function SurroundingItem({
  item,
}: {
  item: POISurrounding;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.icon}
          size={18}
          color={colors.primary[600]}
        />
      </View>
      <Text style={styles.itemLabel}>{item.label}</Text>
    </View>
  );
});

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
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeights.medium,
  },
});
