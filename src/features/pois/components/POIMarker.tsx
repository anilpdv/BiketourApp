import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import { POI, POICategory } from '../types';
import { getCategoryConfig } from '../services/overpass.service';

// Category icon mapping (using emoji for simplicity, could be replaced with vector icons)
const CATEGORY_ICONS: Record<POICategory, string> = {
  campsite: '⛺',
  drinking_water: '💧',
  bike_shop: '🚲',
  bike_repair: '🔧',
  hotel: '🏨',
  hostel: '🛏️',
  guest_house: '🏠',
  shelter: '🏕️',
  supermarket: '🛒',
  restaurant: '🍽️',
};

interface POIMarkerProps {
  poi: POI;
  onPress: (poi: POI) => void;
  isSelected?: boolean;
}

function POIMarkerComponent({ poi, onPress, isSelected = false }: POIMarkerProps) {
  const config = getCategoryConfig(poi.category);
  const icon = CATEGORY_ICONS[poi.category] || '📍';
  const color = config?.color || '#666';

  return (
    <PointAnnotation
      id={poi.id}
      coordinate={[poi.longitude, poi.latitude]}
      onSelected={() => onPress(poi)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
        <View style={[styles.markerBackground, { backgroundColor: color }]}>
          <Text style={styles.markerIcon}>{icon}</Text>
        </View>
        {poi.name && isSelected && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText} numberOfLines={1}>
              {poi.name}
            </Text>
          </View>
        )}
      </View>
    </PointAnnotation>
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
    transform: [{ scale: 1.2 }],
  },
  markerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerIcon: {
    fontSize: 18,
  },
  labelContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
