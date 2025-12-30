import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, sizes } from '../../design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`labelSize_${size}`],
    styles[`labelVariant_${variant}`],
    isDisabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.neutral[0] : colors.primary[500]}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={labelStyle}>{label}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minHeight: 32,
  },
  size_md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: sizes.touchTarget,
  },
  size_lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 52,
  },

  // Variants
  variant_primary: {
    backgroundColor: colors.primary[500],
    ...shadows.md,
  },
  variant_secondary: {
    backgroundColor: colors.secondary[500],
    ...shadows.md,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Label styles
  label: {
    fontWeight: typography.fontWeights.semibold,
  },
  labelSize_sm: {
    fontSize: typography.fontSizes.md,
  },
  labelSize_md: {
    fontSize: typography.fontSizes.lg,
  },
  labelSize_lg: {
    fontSize: typography.fontSizes.xl,
  },
  labelVariant_primary: {
    color: colors.neutral[0],
  },
  labelVariant_secondary: {
    color: colors.neutral[0],
  },
  labelVariant_outline: {
    color: colors.primary[500],
  },
  labelVariant_ghost: {
    color: colors.primary[500],
  },
  labelDisabled: {
    color: colors.neutral[400],
  },
});
