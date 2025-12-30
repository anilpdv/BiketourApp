import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button } from '../Button';
import { colors, spacing, typography, borderRadius } from '../../design/tokens';

export type ErrorMessageVariant = 'inline' | 'banner' | 'full';

export interface ErrorMessageProps {
  message: string;
  variant?: ErrorMessageVariant;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export function ErrorMessage({
  message,
  variant = 'inline',
  onRetry,
  retryLabel = 'Retry',
  style,
}: ErrorMessageProps) {
  if (variant === 'banner') {
    return (
      <View style={[styles.banner, style]}>
        <Text style={styles.bannerText}>{message}</Text>
        {onRetry && (
          <Button
            label={retryLabel}
            onPress={onRetry}
            variant="ghost"
            size="sm"
            textStyle={styles.bannerButtonText}
          />
        )}
      </View>
    );
  }

  if (variant === 'full') {
    return (
      <View style={[styles.full, style]}>
        <Text style={styles.fullIcon}>!</Text>
        <Text style={styles.fullText}>{message}</Text>
        {onRetry && (
          <Button
            label={retryLabel}
            onPress={onRetry}
            variant="outline"
            size="md"
            style={styles.fullButton}
          />
        )}
      </View>
    );
  }

  // inline variant
  return (
    <View style={[styles.inline, style]}>
      <Text style={styles.inlineText}>{message}</Text>
      {onRetry && (
        <Button label={retryLabel} onPress={onRetry} variant="ghost" size="sm" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Inline variant
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  inlineText: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    color: colors.status.error,
  },

  // Banner variant
  banner: {
    backgroundColor: colors.status.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  bannerButtonText: {
    color: colors.neutral[0],
  },

  // Full variant
  full: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  fullIcon: {
    fontSize: 48,
    color: colors.status.error,
    marginBottom: spacing.lg,
  },
  fullText: {
    fontSize: typography.fontSizes.xl,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  fullButton: {
    minWidth: 120,
  },
});
