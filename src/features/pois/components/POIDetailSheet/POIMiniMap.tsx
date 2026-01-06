import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../../types';
import { colors, spacing, borderRadius, typography, shadows } from '../../../../shared/design/tokens';

const MAP_HEIGHT = 150;

interface POIMiniMapProps {
  poi: POI;
  onPress?: () => void;
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
 * Tappable to open directions in native maps app
 */
export const POIMiniMap = memo(function POIMiniMap({ poi, onPress }: POIMiniMapProps) {
  const handleDirectionsPress = () => {
    openDirections(poi.latitude, poi.longitude, poi.name || undefined);
  };

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
        onPress={onPress || handleDirectionsPress}
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
