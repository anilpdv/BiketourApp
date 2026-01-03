import React, { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, shadows, spacing } from '../../../shared/design/tokens';

export interface RoutePlanningFABProps {
  onPress: () => void;
  isPlanning: boolean;
}

/**
 * Floating action button to start route planning
 * Hidden when route planning is active
 */
export const RoutePlanningFAB = memo(function RoutePlanningFAB({
  onPress,
  isPlanning,
}: RoutePlanningFABProps) {
  if (isPlanning) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
      ]}
      onPress={onPress}
      accessibilityLabel="Plan a route"
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name="map-marker-path"
        size={28}
        color={colors.neutral[0]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  fabPressed: {
    backgroundColor: colors.primary[600],
    transform: [{ scale: 0.95 }],
  },
});
