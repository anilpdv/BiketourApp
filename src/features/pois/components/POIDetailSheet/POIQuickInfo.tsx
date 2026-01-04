import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../../types';
import { POIOpenStatusInline } from './POIOpenStatusBadge';
import { getPOITerrain, getPOIRating, isCampingCategory } from '../../utils/poiTagParser';
import { getCategoryConfig } from '../../config/poiCategoryConfig';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POIQuickInfoProps {
  poi: POI;
}

/**
 * Quick info bar showing capacity, open status, category, and rating
 * Displayed below the photo gallery
 */
export const POIQuickInfo = memo(function POIQuickInfo({ poi }: POIQuickInfoProps) {
  const terrain = useMemo(() => getPOITerrain(poi), [poi]);
  const rating = useMemo(() => getPOIRating(poi), [poi]);
  const openingHours = poi.tags.opening_hours;

  const categoryConfig = getCategoryConfig(poi.category);
  const categoryLabel = categoryConfig?.name || poi.category;
  const categoryIcon = categoryConfig?.icon || 'map-marker';
  const categoryColor = categoryConfig?.color || colors.neutral[500];

  // Only show capacity for camping-type POIs
  const showCapacity = isCampingCategory(poi.category) && terrain.capacity;

  // Check if we have any data to display
  const hasCapacity = !!showCapacity;
  const hasOpeningHours = !!openingHours;
  const hasRating = rating.stars !== undefined || rating.rating !== undefined;

  // If nothing to show, render minimal category badge
  if (!hasCapacity && !hasOpeningHours && !hasRating) {
    return (
      <View style={styles.container}>
        <View style={styles.infoRow}>
          <CategoryBadge
            icon={categoryIcon}
            label={categoryLabel}
            color={categoryColor}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        {/* Capacity Badge */}
        {hasCapacity && (
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="tent"
              size={16}
              color={colors.primary[600]}
            />
            <Text style={styles.badgeText}>{terrain.capacity}</Text>
          </View>
        )}

        {/* Open Status */}
        {hasOpeningHours && (
          <POIOpenStatusInline openingHours={openingHours} />
        )}

        {/* Rating */}
        {hasRating && (
          <RatingBadge
            stars={rating.stars}
            rating={rating.rating}
          />
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Category Badge */}
        <CategoryBadge
          icon={categoryIcon}
          label={categoryLabel}
          color={categoryColor}
        />
      </View>
    </View>
  );
});

/**
 * Category badge component
 */
const CategoryBadge = memo(function CategoryBadge({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.categoryText, { color }]}>{label}</Text>
    </View>
  );
});

/**
 * Rating badge component
 */
const RatingBadge = memo(function RatingBadge({
  stars,
  rating,
}: {
  stars?: number;
  rating?: number;
}) {
  // Prefer star rating if available
  const displayValue = stars ?? rating;
  if (displayValue === undefined) return null;

  return (
    <View style={styles.ratingBadge}>
      <MaterialCommunityIcons
        name="star"
        size={14}
        color={colors.status.warning}
      />
      <Text style={styles.ratingText}>{displayValue.toFixed(1)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  spacer: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
});
