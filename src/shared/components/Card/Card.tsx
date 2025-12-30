import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../design/tokens';

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

// Map padding to actual values
const paddingValues: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.lg,
  lg: spacing.xl,
};

// Map variant to elevation
const variantToElevation: Record<CardVariant, 0 | 1 | 2 | 3 | 4 | 5> = {
  default: 1,
  elevated: 3,
  outlined: 0,
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  style,
  onPress,
}: CardProps) {
  const theme = useTheme();
  const elevation = variantToElevation[variant];

  const cardContent = (
    <>
      {header && <View style={styles.header}>{header}</View>}
      <View style={{ padding: paddingValues[padding] }}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  // If pressable, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Surface
          elevation={elevation}
          style={[
            styles.base,
            variant === 'outlined' && styles.outlined,
            style,
          ]}
        >
          {cardContent}
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <Surface
      elevation={elevation}
      style={[
        styles.base,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
    >
      {cardContent}
    </Surface>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    padding: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    padding: spacing.lg,
  },
});

export default Card;
