/**
 * Route Drag Preview Component
 * Shows a preview marker and confirmation UI when user presses the route line
 * to add a via waypoint
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MarkerView } from '@maplibre/maplibre-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Coordinate } from '../types';
import { colors, shadows } from '../../../shared/design/tokens';

interface RouteDragPreviewProps {
  /** Coordinate where the preview marker should appear */
  coordinate: Coordinate;
  /** Callback to confirm and add the via waypoint */
  onConfirm: () => void;
  /** Callback to cancel the preview */
  onCancel: () => void;
}

/**
 * Visual preview shown when user presses on route line
 * Shows a pulsing marker with confirm/cancel buttons
 */
export function RouteDragPreview({
  coordinate,
  onConfirm,
  onCancel,
}: RouteDragPreviewProps) {
  // Pulsing animation for the preview marker
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  React.useEffect(() => {
    // Start pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.7, { duration: 600 })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <>
      {/* Preview marker on map */}
      <MarkerView
        coordinate={[coordinate.longitude, coordinate.latitude]}
        anchor={{ x: 0.5, y: 0.5 }}
        allowOverlap={true}
      >
        <Animated.View style={[styles.previewMarker, animatedStyle]}>
          <View style={styles.markerInner}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.neutral[0]} />
          </View>
          <View style={styles.markerPointer} />
        </Animated.View>
      </MarkerView>

      {/* Confirmation buttons overlay */}
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationText}>Add waypoint here?</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.neutral[600]} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <MaterialCommunityIcons name="check" size={20} color={colors.neutral[0]} />
              <Text style={styles.confirmButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  previewMarker: {
    alignItems: 'center',
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6', // Purple for preview
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.neutral[0],
    ...shadows.lg,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8B5CF6',
    marginTop: -2,
  },
  confirmationOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  confirmationCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
    ...shadows.lg,
    minWidth: 220,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[0],
  },
});
