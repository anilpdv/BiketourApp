import React, { memo, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { MarkerView } from '@maplibre/maplibre-react-native';
import type { MapViewRef } from '@maplibre/maplibre-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Waypoint, Coordinate } from '../types';
import { colors, shadows } from '../../../shared/design/tokens';

interface DraggableWaypointMarkerProps {
  waypoint: Waypoint;
  onDrag: (waypointId: string, newCoordinate: Coordinate) => void;
  onDragEnd: () => void;
  mapRef: React.RefObject<MapViewRef | null>;
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
  // Use shared values for smooth animations (runs on UI thread)
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Handler that runs on JS thread - converts screen coords to map coords
  const handleDragUpdate = useCallback(
    (absoluteX: number, absoluteY: number) => {
      mapRef.current
        ?.getCoordinateFromView([absoluteX, absoluteY])
        .then((coords) => {
          if (coords) {
            onDrag(waypoint.id, {
              latitude: coords[1],
              longitude: coords[0],
            });
          }
        })
        .catch(() => {
          // Ignore errors during rapid updates
        });
    },
    [mapRef, onDrag, waypoint.id]
  );

  // Handler for drag end - runs on JS thread
  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  // Animated style for smooth drag feedback
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Pan gesture with proper worklet handling
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.2, { damping: 15, stiffness: 200 });
      opacity.value = withSpring(0.85);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(handleDragUpdate)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withSpring(1);
      runOnJS(handleDragEnd)();
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
        <Animated.View style={[styles.markerContainer, animatedStyle]}>
          <Animated.View style={[styles.marker, { backgroundColor: color }]}>
            <Text style={styles.number}>{waypoint.order + 1}</Text>
          </Animated.View>
          <Animated.View style={[styles.pointer, { borderTopColor: color }]} />
        </Animated.View>
      </GestureDetector>
    </MarkerView>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
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
