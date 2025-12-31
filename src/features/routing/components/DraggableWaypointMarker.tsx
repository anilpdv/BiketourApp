import React, { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarkerView, MapView } from '@rnmapbox/maps';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Waypoint, Coordinate } from '../types';
import { colors, shadows } from '../../../shared/design/tokens';

interface DraggableWaypointMarkerProps {
  waypoint: Waypoint;
  onDrag: (waypointId: string, newCoordinate: Coordinate) => void;
  onDragEnd: () => void;
  mapRef: React.RefObject<MapView | null>;
}

/**
 * Draggable waypoint marker using MarkerView + PanGestureHandler
 * MarkerView supports nested Views (unlike PointAnnotation)
 */
export const DraggableWaypointMarker = memo(function DraggableWaypointMarker({
  waypoint,
  onDrag,
  onDragEnd,
  mapRef,
}: DraggableWaypointMarkerProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Convert screen coords to map coords during drag
  const panGesture = Gesture.Pan()
    .onStart(() => {
      setIsDragging(true);
    })
    .onUpdate(async (e) => {
      try {
        const coords = await mapRef.current?.getCoordinateFromView([e.absoluteX, e.absoluteY]);
        if (coords) {
          onDrag(waypoint.id, {
            latitude: coords[1],
            longitude: coords[0],
          });
        }
      } catch (error) {
        // Ignore errors during rapid updates
      }
    })
    .onEnd(() => {
      setIsDragging(false);
      onDragEnd();
    });

  // Color based on waypoint type
  const color =
    waypoint.type === 'start'
      ? '#22C55E' // Green
      : waypoint.type === 'end'
      ? '#EF4444' // Red
      : '#3B82F6'; // Blue

  return (
    <MarkerView
      coordinate={[waypoint.longitude, waypoint.latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
      allowOverlap={true}
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.markerContainer, isDragging && styles.dragging]}>
          <View style={[styles.marker, { backgroundColor: color }]}>
            <Text style={styles.number}>{waypoint.order + 1}</Text>
          </View>
          <View style={[styles.pointer, { borderTopColor: color }]} />
        </View>
      </GestureDetector>
    </MarkerView>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  dragging: {
    transform: [{ scale: 1.2 }],
    opacity: 0.9,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.neutral[0],
    ...shadows.lg,
  },
  number: {
    color: colors.neutral[0],
    fontSize: 14,
    fontWeight: '700',
  },
  pointer: {
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
