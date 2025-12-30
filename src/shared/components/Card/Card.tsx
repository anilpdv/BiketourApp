import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  style,
}: CardProps) {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], style]}>
      {header && <View style={styles.header}>{header}</View>}
      <View style={[styles.content, styles[`padding_${padding}`]]}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  // Variants
  variant_default: {
    ...shadows.md,
  },
  variant_elevated: {
    ...shadows.lg,
  },
  variant_outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.lg,
  },
  padding_lg: {
    padding: spacing.xl,
  },

  // Sections
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    padding: spacing.lg,
  },
  content: {},
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    padding: spacing.lg,
  },
});
