import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Pressable, Image, Linking, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { getCategoryConfig } from '../../config/poiCategoryConfig';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

// Mapbox Static API configuration
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
const MAP_WIDTH = 400;
const MAP_HEIGHT = 150;

interface POIMiniMapProps {
  poi: POI;
  onPress?: () => void;
}

/**
 * Generate Mapbox Static API URL for a POI location
 */
function getStaticMapUrl(lat: number, lon: number, markerColor: string): string {
  // Remove # from color for Mapbox pin format
  const cleanColor = markerColor.replace('#', '');
  const marker = `pin-l+${cleanColor}(${lon},${lat})`;

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lon},${lat},14,0/${MAP_WIDTH}x${MAP_HEIGHT}@2x?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Open directions to POI in maps app
 */
function openDirections(lat: number, lon: number, name?: string) {
  const label = encodeURIComponent(name || 'POI');

  if (Platform.OS === 'ios') {
    // Apple Maps
    Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lon}&q=${label}`);
  } else {
    // Google Maps
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
  }
}

/**
 * Mini map preview showing POI location
 * Tappable to center main map or open directions
 */
export const POIMiniMap = memo(function POIMiniMap({ poi, onPress }: POIMiniMapProps) {
  const categoryConfig = getCategoryConfig(poi.category);
  const markerColor = categoryConfig?.color || colors.primary[500];

  const mapUrl = useMemo(() => {
    if (!MAPBOX_TOKEN) return null;
    return getStaticMapUrl(poi.latitude, poi.longitude, markerColor);
  }, [poi.latitude, poi.longitude, markerColor]);

  const handleDirectionsPress = () => {
    openDirections(poi.latitude, poi.longitude, poi.name || undefined);
  };

  // Don't render if no Mapbox token or mapUrl
  if (!mapUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="map"
            size={20}
            color={colors.primary[500]}
            style={styles.headerIcon}
          />
          <Text style={styles.headerText}>Location</Text>
        </View>
        <Pressable
          style={styles.fallbackContainer}
          onPress={handleDirectionsPress}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={40}
            color={colors.neutral[400]}
          />
          <Text style={styles.fallbackText}>Tap to open in Maps</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="map"
          size={20}
          color={colors.primary[500]}
          style={styles.headerIcon}
        />
        <Text style={styles.headerText}>Location</Text>
        <Pressable onPress={handleDirectionsPress} style={styles.directionsButton}>
          <MaterialCommunityIcons name="directions" size={16} color={colors.primary[500]} />
          <Text style={styles.directionsText}>Directions</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onPress || handleDirectionsPress}
        style={styles.mapContainer}
      >
        <Image
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color={colors.neutral[0]}
          />
        </View>
      </Pressable>
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
    flex: 1,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  directionsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeights.medium,
  },
  mapContainer: {
    position: 'relative',
    height: MAP_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  fallbackContainer: {
    height: MAP_HEIGHT,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fallbackText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
});
