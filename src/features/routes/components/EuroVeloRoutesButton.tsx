import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

interface EuroVeloRoutesButtonProps {
  activeCount: number;
  onPress: () => void;
}

export const EuroVeloRoutesButton = memo(function EuroVeloRoutesButton({
  activeCount,
  onPress,
}: EuroVeloRoutesButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`EuroVelo Routes, ${activeCount} active`}
    >
      <MaterialCommunityIcons
        name="bike-fast"
        size={22}
        color={colors.primary[600]}
      />
      <Text style={styles.text}>EuroVelo Routes</Text>
      {activeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount} active</Text>
        </View>
      )}
      <MaterialCommunityIcons
        name="chevron-up"
        size={20}
        color={colors.neutral[500]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 10,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.lg,
  },
  buttonPressed: {
    backgroundColor: colors.neutral[50],
  },
  text: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[700],
  },
});
