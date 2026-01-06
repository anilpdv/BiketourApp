import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getCategoryIcon, CATEGORY_NAMES } from '../../config/poiIcons';
import { getPOIContactInfo } from '../../utils/poiTagParser';
import { parseOpeningHours } from '../../utils/openingHoursParser';
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

/**
 * Format location string from contact info
 */
function formatLocation(contactInfo: { city?: string; country?: string }): string | null {
  const parts = [contactInfo.city, contactInfo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
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

  // Get capacity
  const capacity = poi.tags?.capacity;

  // Get opening hours status
  const openingHours = parseOpeningHours(poi.tags?.opening_hours);

  // Format location (city, country)
  const location = formatLocation(contactInfo) || CATEGORY_NAMES[poi.category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${poi.name || CATEGORY_NAMES[poi.category]}${distance ? `, ${formatDistance(distance)} away` : ''}`}
    >
      {/* Image section with gradient */}
      <View style={styles.imageContainer}>
        <LinearGradient
          colors={[categoryConfig.color + '15', categoryConfig.color + '45']}
          style={styles.imagePlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <MaterialCommunityIcons
            name={categoryConfig.vectorIcon as any}
            size={48}
            color={categoryConfig.color}
          />
        </LinearGradient>

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
            size={22}
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

        {/* Location (city, country) */}
        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>

        {/* Rating and capacity row */}
        <View style={styles.infoRow}>
          {/* Rating badge - GREEN */}
          {rating && (
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={colors.neutral[0]}
              />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}

          {/* Capacity with icon */}
          {capacity && (
            <View style={styles.capacityContainer}>
              <MaterialCommunityIcons
                name="tent"
                size={14}
                color={colors.neutral[500]}
              />
              <Text style={styles.capacityText}>{capacity}</Text>
            </View>
          )}
        </View>

        {/* Opening hours status */}
        {openingHours && (
          <Text
            style={[
              styles.openStatus,
              openingHours.isOpen ? styles.openStatusOpen : styles.openStatusClosed,
            ]}
          >
            {openingHours.isOpen ? 'Open today' : 'Closed'}
          </Text>
        )}

        {/* Bottom row: price and distance */}
        <View style={styles.bottomRow}>
          {price ? (
            <Text style={styles.price}>{price}</Text>
          ) : (
            <View />
          )}
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
    width: 130,
    height: 150,
    position: 'relative',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  name: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  location: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
  openStatus: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  openStatusOpen: {
    color: colors.primary[600],
  },
  openStatusClosed: {
    color: colors.status.error,
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
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
  },
});

export default POIListCard;
