import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getCategoryIcon, CATEGORY_NAMES } from '../../config/poiIcons';
import { getCategoryGroupColor, CATEGORY_TO_GROUP, CATEGORY_GROUP_COLORS } from '../../config/poiGroupColors';
import { getPOIContactInfo } from '../../utils/poiTagParser';
import { parseOpeningHours } from '../../utils/openingHoursParser';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../shared/design/tokens';

// Light background colors for each group
const GROUP_BG_COLORS: Record<string, string> = {
  camping: '#E8F5E9',
  services: '#E0F7FA',
  accommodation: '#EDE7F6',
  bike: '#FFF3E0',
  food: '#FFEBEE',
  emergency: '#FFEBEE',
};

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
  const groupKey = CATEGORY_TO_GROUP[poi.category];
  const groupColor = CATEGORY_GROUP_COLORS[groupKey];
  const groupBgColor = GROUP_BG_COLORS[groupKey] || colors.neutral[100];

  // Get rating if available
  const rating = poi.tags?.stars || poi.tags?.rating;

  // Get price info
  const price = poi.tags?.fee;

  // Get opening hours status
  const openingHours = parseOpeningHours(poi.tags?.opening_hours);

  // Format location (city, country) - don't show category name as fallback
  const location = formatLocation(contactInfo);

  // Display name - use POI name or category name
  const displayName = poi.name || CATEGORY_NAMES[poi.category];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}${distance ? `, ${formatDistance(distance)} away` : ''}`}
    >
      {/* Icon section */}
      <View style={[styles.iconContainer, { backgroundColor: groupBgColor }]}>
        <MaterialCommunityIcons
          name={categoryConfig.vectorIcon as any}
          size={28}
          color={groupColor}
        />
      </View>

      {/* Content section */}
      <View style={styles.content}>
        {/* Top row: Name and favorite */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#E53935' : colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>

        {/* Category chip + Location */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { backgroundColor: groupColor }]}>
            <Text style={styles.categoryText}>{CATEGORY_NAMES[poi.category]}</Text>
          </View>
          {location && (
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          )}
        </View>

        {/* Bottom row: Rating, Opening status, Price, Distance */}
        <View style={styles.bottomRow}>
          <View style={styles.leftInfo}>
            {rating && (
              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#FFC107" />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            )}
            {openingHours && (
              <Text style={[
                styles.openStatus,
                { color: openingHours.isOpen ? '#4CAF50' : '#9E9E9E' }
              ]}>
                {openingHours.isOpen ? 'Open' : 'Closed'}
              </Text>
            )}
            {price && <Text style={styles.price}>{price}</Text>}
          </View>
          {distance !== undefined && (
            <View style={styles.distanceContainer}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.neutral[500]} />
              <Text style={styles.distance}>{formatDistance(distance)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginVertical: 6,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardPressed: {
    backgroundColor: colors.neutral[50],
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginRight: spacing.sm,
  },
  favoriteButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  location: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  openStatus: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  price: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
  },
});

export default POIListCard;
