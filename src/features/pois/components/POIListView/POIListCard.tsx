import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getCategoryIcon, CATEGORY_NAMES } from '../../config/poiIcons';
import { getPOIContactInfo } from '../../utils/poiTagParser';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

interface POIListCardProps {
  poi: POI;
  distance?: number;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

/**
 * Format distance for display
 */
function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

export const POIListCard = memo(function POIListCard({
  poi,
  distance,
  isFavorite,
  onPress,
  onToggleFavorite,
}: POIListCardProps) {
  const categoryConfig = getCategoryIcon(poi.category);
  const contactInfo = getPOIContactInfo(poi);

  // Get rating if available
  const rating = poi.tags?.stars || poi.tags?.rating;

  // Get price info
  const price = poi.tags?.fee;

  // Get facilities info
  const facilities: string[] = [];
  if (poi.tags?.capacity) facilities.push(`Capacity: ${poi.tags.capacity}`);
  if (poi.tags?.internet_access === 'yes' || poi.tags?.wifi === 'yes')
    facilities.push('WiFi');
  if (poi.tags?.power_supply === 'yes') facilities.push('Power');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${poi.name || CATEGORY_NAMES[poi.category]}${distance ? `, ${formatDistance(distance)} away` : ''}`}
    >
      {/* Image section */}
      <View style={styles.imageContainer}>
        {/* Placeholder image with category icon */}
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: categoryConfig.color + '20' },
          ]}
        >
          <MaterialCommunityIcons
            name={categoryConfig.vectorIcon as any}
            size={40}
            color={categoryConfig.color}
          />
        </View>

        {/* Favorite button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.status.favorite : colors.neutral[0]}
          />
        </TouchableOpacity>
      </View>

      {/* Content section */}
      <View style={styles.content}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {poi.name || CATEGORY_NAMES[poi.category]}
        </Text>

        {/* Location / Category */}
        <Text style={styles.location} numberOfLines={1}>
          {contactInfo.address || CATEGORY_NAMES[poi.category]}
        </Text>

        {/* Rating badge */}
        {rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={colors.neutral[0]}
              />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          </View>
        )}

        {/* Facilities row */}
        {facilities.length > 0 && (
          <View style={styles.facilitiesRow}>
            {facilities.slice(0, 3).map((facility, index) => (
              <Text key={index} style={styles.facilityText}>
                {facility}
                {index < facilities.length - 1 ? ' · ' : ''}
              </Text>
            ))}
          </View>
        )}

        {/* Bottom row: price and distance */}
        <View style={styles.bottomRow}>
          {price && <Text style={styles.price}>{price}</Text>}
          {distance !== undefined && (
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  imageContainer: {
    width: 120,
    height: 140,
    position: 'relative',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  ratingText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  facilityText: {
    fontSize: typography.fontSizes.sm,
    color: colors.secondary[600],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  distance: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
  },
});

export default POIListCard;
