import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  sizes,
} from '../../../../shared/design/tokens';

interface MapControlsBottomProps {
  hasLocation: boolean;
  onCenterOnLocation: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenLayers: () => void;
}

export const MapControlsBottom = memo(function MapControlsBottom({
  hasLocation,
  onCenterOnLocation,
  onZoomIn,
  onZoomOut,
  onOpenLayers,
}: MapControlsBottomProps) {
  return (
    <View style={styles.container}>
      {/* Location button */}
      <TouchableOpacity
        style={[styles.button, !hasLocation && styles.buttonDisabled]}
        onPress={onCenterOnLocation}
        disabled={!hasLocation}
        accessibilityRole="button"
        accessibilityLabel="Center on my location"
        accessibilityState={{ disabled: !hasLocation }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={hasLocation ? colors.neutral[700] : colors.neutral[400]}
        />
      </TouchableOpacity>

      {/* Zoom controls group */}
      <View style={styles.zoomGroup}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={onZoomIn}
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.neutral[700]}
          />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={onZoomOut}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="minus"
            size={24}
            color={colors.neutral[700]}
          />
        </TouchableOpacity>
      </View>

      {/* Layers button */}
      <TouchableOpacity
        style={styles.button}
        onPress={onOpenLayers}
        accessibilityRole="button"
        accessibilityLabel="Change map style"
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="layers"
          size={24}
          color={colors.neutral[700]}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: spacing.lg,
    zIndex: 5,
    gap: spacing.sm,
  },
  button: {
    width: sizes.iconButton.md,
    height: sizes.iconButton.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[100],
  },
  zoomGroup: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  zoomButton: {
    width: sizes.iconButton.md,
    height: sizes.iconButton.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
});

export default MapControlsBottom;
