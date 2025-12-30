import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows, sizes } from '../../design/tokens';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: string;
  onPress: () => void;
  isActive?: boolean;
  activeColor?: string;
  activeBackgroundColor?: string;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  isActive = false,
  activeColor = colors.primary[500],
  activeBackgroundColor,
  size = 'md',
  disabled = false,
  style,
}: IconButtonProps) {
  const sizeValue = sizes.iconButton[size];
  const defaultActiveBackground = activeBackgroundColor || `${activeColor}15`;

  const buttonStyle = [
    styles.base,
    {
      width: sizeValue,
      height: sizeValue,
      borderRadius: sizeValue / 2,
    },
    isActive && {
      borderColor: activeColor,
      backgroundColor: defaultActiveBackground,
    },
    disabled && styles.disabled,
    style,
  ];

  const iconStyle = [
    styles.icon,
    size === 'sm' && styles.iconSm,
    size === 'lg' && styles.iconLg,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={iconStyle}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 20,
  },
  iconSm: {
    fontSize: 16,
  },
  iconLg: {
    fontSize: 24,
  },
});
