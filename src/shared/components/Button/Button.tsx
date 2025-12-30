import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';
import { colors } from '../../design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode | ((props: { size: number; color: string }) => React.ReactNode);
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Map our variants to Paper's button modes
const variantToMode: Record<ButtonVariant, 'contained' | 'outlined' | 'text' | 'contained-tonal'> = {
  primary: 'contained',
  secondary: 'contained-tonal',
  outline: 'outlined',
  ghost: 'text',
};

// Size configurations
const sizeConfig = {
  sm: {
    contentStyle: { paddingVertical: 0, paddingHorizontal: 4 },
    labelStyle: { fontSize: 12, marginVertical: 4 },
  },
  md: {
    contentStyle: { paddingVertical: 2, paddingHorizontal: 8 },
    labelStyle: { fontSize: 14, marginVertical: 6 },
  },
  lg: {
    contentStyle: { paddingVertical: 4, paddingHorizontal: 12 },
    labelStyle: { fontSize: 16, marginVertical: 8 },
  },
};

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
  const theme = useTheme();
  const mode = variantToMode[variant];
  const sizeStyles = sizeConfig[size];

  // Get button color based on variant
  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary[500];
      case 'secondary':
        return colors.secondary[500];
      default:
        return undefined;
    }
  };

  // Handle icon rendering
  const renderIcon = icon
    ? typeof icon === 'function'
      ? icon
      : () => icon
    : undefined;

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={iconPosition === 'left' ? renderIcon : undefined}
      buttonColor={getButtonColor()}
      textColor={
        variant === 'outline' || variant === 'ghost'
          ? colors.primary[500]
          : undefined
      }
      style={[style]}
      contentStyle={[
        sizeStyles.contentStyle,
        iconPosition === 'right' && renderIcon
          ? { flexDirection: 'row-reverse' }
          : undefined,
      ]}
      labelStyle={[sizeStyles.labelStyle, textStyle]}
    >
      {label}
    </PaperButton>
  );
}

export default Button;
