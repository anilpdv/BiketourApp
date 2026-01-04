import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MarkerView } from '@rnmapbox/maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI } from '../types';
import { getCategoryIcon } from '../config/poiIcons';
import { getCategoryGroupColor } from '../config/poiGroupColors';
import { colors } from '../../../shared/design/tokens';

interface POIMarkerProps {
  poi: POI;
  onPress: (poi: POI) => void;
  isSelected?: boolean;
}

/**
 * POI Marker using MarkerView (supports nested Views, unlike PointAnnotation)
 * Renders droplet-shaped pins with category icons
 */
function POIMarkerComponent({ poi, onPress, isSelected = false }: POIMarkerProps) {
  const iconConfig = getCategoryIcon(poi.category);
  const groupColor = getCategoryGroupColor(poi.category);

  return (
    <MarkerView
      coordinate={[poi.longitude, poi.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      allowOverlap={true}
    >
      <Pressable onPress={() => onPress(poi)}>
        <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
          {/* Pin body */}
          <View style={[styles.pinBody, { backgroundColor: groupColor }]}>
            <MaterialCommunityIcons
              name={iconConfig.vectorIcon}
              size={22}
              color={colors.neutral[0]}
            />
          </View>
          {/* Pin pointer */}
          <View style={[styles.pinPointer, { borderTopColor: groupColor }]} />
        </View>
      </Pressable>
    </MarkerView>
  );
}

// Memoize to prevent unnecessary re-renders
export const POIMarker = memo(POIMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.poi.id === nextProps.poi.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
  },
  pinBody: {
    width: 36,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
