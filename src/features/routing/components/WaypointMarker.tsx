import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import { Waypoint } from '../types';

interface WaypointMarkerProps {
  waypoint: Waypoint;
  onDragEnd?: (waypoint: Waypoint, coordinate: { latitude: number; longitude: number }) => void;
  onPress?: (waypoint: Waypoint) => void;
  draggable?: boolean;
}

const WAYPOINT_COLORS = {
  start: '#4CAF50', // Green
  via: '#2196F3', // Blue
  end: '#f44336', // Red
};

const WAYPOINT_ICONS = {
  start: '🚩',
  via: '📍',
  end: '🏁',
};

function WaypointMarkerComponent({
  waypoint,
  onDragEnd,
  onPress,
  draggable = true,
}: WaypointMarkerProps) {
  const color = WAYPOINT_COLORS[waypoint.type];
  const icon = WAYPOINT_ICONS[waypoint.type];

  return (
    <PointAnnotation
      id={waypoint.id}
      coordinate={[waypoint.longitude, waypoint.latitude]}
      draggable={draggable}
      onDragEnd={(event) => {
        if (onDragEnd) {
          const [longitude, latitude] = event.geometry.coordinates;
          onDragEnd(waypoint, { latitude, longitude });
        }
      }}
      onSelected={() => onPress?.(waypoint)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.markerCircle, { backgroundColor: color }]}>
          <Text style={styles.markerIcon}>{icon}</Text>
        </View>
        <View style={[styles.orderBadge, { backgroundColor: color }]}>
          <Text style={styles.orderText}>{waypoint.order + 1}</Text>
        </View>
        {waypoint.name && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText} numberOfLines={1}>
              {waypoint.name}
            </Text>
          </View>
        )}
      </View>
    </PointAnnotation>
  );
}

export const WaypointMarker = memo(WaypointMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.waypoint.id === nextProps.waypoint.id &&
    prevProps.waypoint.latitude === nextProps.waypoint.latitude &&
    prevProps.waypoint.longitude === nextProps.waypoint.longitude &&
    prevProps.waypoint.type === nextProps.waypoint.type &&
    prevProps.waypoint.order === nextProps.waypoint.order
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 18,
  },
  orderBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  orderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    maxWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
