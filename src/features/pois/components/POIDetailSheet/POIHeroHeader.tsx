import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { POI } from '../../types';
import { getCategoryIcon } from '../../config/poiIcons';
import { getCategoryConfig } from '../../services/overpass.service';
import { FavoriteButton } from '../FavoriteButton';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

interface POIHeroHeaderProps {
  poi: POI;
}

/**
 * Format distance for display
 */
function formatDistance(meters?: number): string {
  if (!meters) return '';
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Open location in Google Maps (consistent across platforms)
 */
function openInGoogleMaps(lat: number, lon: number, name?: string) {
  const label = encodeURIComponent(name || 'Location');
  // Always use Google Maps for consistency
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${label}`);
}

/**
 * Hero header with category icon, name, and quick actions
 */
export const POIHeroHeader = memo(function POIHeroHeader({ poi }: POIHeroHeaderProps) {
  const iconConfig = getCategoryIcon(poi.category);
  const categoryConfig = getCategoryConfig(poi.category);
  const distanceText = formatDistance(poi.distanceFromUser);

  const handleOpenMaps = () => {
    openInGoogleMaps(poi.latitude, poi.longitude, poi.name || undefined);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[iconConfig.color + '15', iconConfig.color + '05']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Icon and Info */}
        <View style={styles.mainRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.color }]}>
            <MaterialCommunityIcons
              name={iconConfig.vectorIcon}
              size={32}
              color={colors.neutral[0]}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {poi.name || categoryConfig?.name || 'Unknown'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{categoryConfig?.name}</Text>
              {distanceText && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.distance}>{distanceText}</Text>
                </>
              )}
            </View>
          </View>

          <FavoriteButton poi={poi} size="medium" />
        </View>

        {/* Open in Google Maps Button */}
        <Pressable
          style={styles.mapsButton}
          onPress={handleOpenMaps}
          android_ripple={{ color: colors.primary[100] }}
        >
          <MaterialCommunityIcons
            name="google-maps"
            size={22}
            color={colors.primary[600]}
          />
          <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.primary[400]}
          />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.neutral[0],
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.md,
  },
  infoContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
  },
  dot: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[400],
    marginHorizontal: spacing.xs,
  },
  distance: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  mapsButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[600],
    flex: 1,
  },
});
