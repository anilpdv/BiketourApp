/**
 * LabeledIconButton Component
 * An icon button with a text label below it, commonly used for action rows
 */

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, borderRadius } from '../../design/tokens';

export interface LabeledIconButtonProps {
  /** MaterialCommunityIcons icon name */
  icon: string;
  /** Label text displayed below the icon */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Icon color (default: neutral[600]) */
  color?: string;
  /** Icon size (default: 24) */
  iconSize?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Container style override */
  style?: ViewStyle;
  /** Label style override */
  labelStyle?: TextStyle;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * An icon button with a label below, useful for action rows
 */
export const LabeledIconButton = memo(function LabeledIconButton({
  icon,
  label,
  onPress,
  color = colors.neutral[600],
  iconSize = 24,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
}: LabeledIconButtonProps) {
  return (
    <Pressable
      style={[styles.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled }}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
      </View>
      <Text
        style={[styles.label, labelStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LabeledIconButton;
