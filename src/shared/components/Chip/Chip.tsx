import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../design/tokens';

export interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  color?: string;
  count?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Chip({
  label,
  icon,
  selected = false,
  color,
  count,
  onPress,
  disabled = false,
  style,
}: ChipProps) {
  const chipStyle = [
    styles.base,
    selected && styles.selected,
    color && selected && { borderColor: color, backgroundColor: `${color}15` },
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    selected && styles.labelSelected,
    color && selected && { color },
  ];

  const content = (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={textStyle}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.countBadge, color && { backgroundColor: color }]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={chipStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={chipStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  selected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  disabled: {
    opacity: 0.5,
  },

  iconContainer: {
    marginRight: spacing.xs,
  },

  label: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[600],
  },
  labelSelected: {
    color: colors.primary[700],
    fontWeight: typography.fontWeights.bold,
  },

  countBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
});
