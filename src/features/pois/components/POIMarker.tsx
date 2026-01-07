import React, { memo } from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MarkerView } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POI } from '../types';
import { getCategoryIcon } from '../config/poiIcons';
import { POIPriority, getCategoryPriority } from '../config/poiGroupColors';
import { colors } from '../../../shared/design/tokens';

/**
 * Tiered shape system: droplets for high priority, circles with notch for lower priority
 * Essential/Important = Small droplet pins (reverted to old sizes)
 * Secondary/Optional = Circles with notch indicator
 */
type MarkerShape = 'droplet' | 'circle';

interface MarkerSizeConfig {
  shape: MarkerShape;
  width: number;
  height: number;
  iconSize: number;
  borderWidth: number;
  pointerWidth?: number;
  pointerHeight?: number;
  notchSize?: number;
}

export const MARKER_SIZES: Record<POIPriority, MarkerSizeConfig> = {
  // ORIGINAL big droplet sizes (from git history commit 681b2e6)
  essential: {
    shape: 'droplet',
    width: 36,
    height: 40,
    iconSize: 22,
    borderWidth: 2,
    pointerWidth: 8,
    pointerHeight: 10,
  },
  important: {
    shape: 'droplet',
    width: 36,
    height: 40,
    iconSize: 22,
    borderWidth: 2,
    pointerWidth: 8,
    pointerHeight: 10,
  },
  // Circles with small notch indicator
  secondary: {
    shape: 'circle',
    width: 22,
    height: 22,
    iconSize: 12,
    borderWidth: 1,
    notchSize: 4,
  },
  optional: {
    shape: 'circle',
    width: 16,
    height: 16,
    iconSize: 9,
    borderWidth: 1,
    notchSize: 3,
  },
};

interface POIMarkerProps {
  poi: POI;
  onPress: (poi: POI) => void;
  isSelected?: boolean;
  /** Override the auto-detected priority/size */
  priorityOverride?: POIPriority;
}

/**
 * POI Marker using MarkerView (supports nested Views, unlike PointAnnotation)
 * Tiered shape system: droplets for high priority, circles for lower priority
 */
function POIMarkerComponent({ poi, onPress, isSelected = false, priorityOverride }: POIMarkerProps) {
  const iconConfig = getCategoryIcon(poi.category);
  const priority = priorityOverride || getCategoryPriority(poi.category);
  const size = MARKER_SIZES[priority];

  // All shapes now anchor at bottom since all have pointers/notches
  const anchor = { x: 0.5, y: 1 };

  return (
    <MarkerView
      coordinate={[poi.longitude, poi.latitude]}
      anchor={anchor}
      allowOverlap={false}
    >
      <Pressable onPress={() => onPress(poi)}>
        {size.shape === 'droplet' ? (
          // Droplet pin for essential/important - 70% of original
          <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
            <View style={[styles.originalPinBody, { backgroundColor: iconConfig.groupColor }]}>
              <MaterialCommunityIcons
                name={iconConfig.vectorIcon}
                size={15}
                color={colors.neutral[0]}
              />
            </View>
            <View style={[styles.originalPinPointer, { borderTopColor: iconConfig.groupColor }]} />
          </View>
        ) : priority === 'secondary' ? (
          // Secondary - small droplet
          <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
            <View style={[styles.secondaryPinBody, { backgroundColor: iconConfig.groupColor }]}>
              <MaterialCommunityIcons
                name={iconConfig.vectorIcon}
                size={11}
                color={colors.neutral[0]}
              />
            </View>
            <View style={[styles.secondaryPinPointer, { borderTopColor: iconConfig.groupColor }]} />
          </View>
        ) : (
          // Optional - tiny droplet
          <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
            <View style={[styles.optionalPinBody, { backgroundColor: iconConfig.groupColor }]}>
              <MaterialCommunityIcons
                name={iconConfig.vectorIcon}
                size={9}
                color={colors.neutral[0]}
              />
            </View>
            <View style={[styles.optionalPinPointer, { borderTopColor: iconConfig.groupColor }]} />
          </View>
        )}
      </Pressable>
    </MarkerView>
  );
}

// Memoize to prevent unnecessary re-renders
export const POIMarker = memo(POIMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.poi.id === nextProps.poi.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.priorityOverride === nextProps.priorityOverride
  );
});

/**
 * Standalone marker view for image generation (no MapView dependency)
 */
interface StandaloneMarkerProps {
  color: string;
  iconName: string;
  priority: POIPriority;
}

export function StandaloneMarker({ color, iconName, priority }: StandaloneMarkerProps) {
  const size = MARKER_SIZES[priority];

  if (priority === 'essential' || priority === 'important') {
    // Essential/Important - medium droplet (70% of original)
    return (
      <View style={styles.markerContainer}>
        <View style={[styles.originalPinBody, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={15}
            color={colors.neutral[0]}
          />
        </View>
        <View style={[styles.originalPinPointer, { borderTopColor: color }]} />
      </View>
    );
  }

  if (priority === 'secondary') {
    // Secondary - small droplet
    return (
      <View style={styles.markerContainer}>
        <View style={[styles.secondaryPinBody, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={11}
            color={colors.neutral[0]}
          />
        </View>
        <View style={[styles.secondaryPinPointer, { borderTopColor: color }]} />
      </View>
    );
  }

  // Optional - tiny droplet
  return (
    <View style={styles.markerContainer}>
      <View style={[styles.optionalPinBody, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={9}
          color={colors.neutral[0]}
        />
      </View>
      <View style={[styles.optionalPinPointer, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // EXACT original marker styles (from git commit 681b2e6)
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
  },
  originalPinBody: {
    width: 25,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  originalPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  // Secondary droplet (smaller)
  secondaryPinBody: {
    width: 18,
    height: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  secondaryPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  // Optional droplet (tiny)
  optionalPinBody: {
    width: 14,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  optionalPinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
