import React, { memo } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, shadows, spacing, typography, borderRadius } from '../../../shared/design/tokens';

export interface NavigationStartButtonProps {
  onPress: () => void;
  routeName?: string;
  disabled?: boolean;
}

/**
 * Floating action button to start navigation
 * Shows when a route is loaded but not navigating
 */
export const NavigationStartButton = memo(function NavigationStartButton({
  onPress,
  routeName,
  disabled = false,
}: NavigationStartButtonProps) {
  return (
    <View style={styles.container}>
      {/* Route name chip */}
      {routeName && (
        <View style={styles.routeChip}>
          <Text style={styles.routeChipText} numberOfLines={1}>
            {routeName}
          </Text>
        </View>
      )}

      {/* Start navigation button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && !disabled && styles.fabPressed,
          disabled && styles.fabDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel="Start navigation"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name="navigation"
          size={28}
          color={colors.neutral[0]}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  routeChip: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    maxWidth: 150,
    ...shadows.md,
  },
  routeChipText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  fabPressed: {
    backgroundColor: colors.secondary[600],
    transform: [{ scale: 0.95 }],
  },
  fabDisabled: {
    backgroundColor: colors.neutral[300],
  },
});
