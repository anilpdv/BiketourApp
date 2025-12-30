import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Banner, useTheme } from 'react-native-paper';
import { Button } from '../Button';
import { colors, spacing, borderRadius } from '../../design/tokens';

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
  const theme = useTheme();

  if (variant === 'banner') {
    return (
      <Banner
        visible
        icon="alert-circle"
        actions={
          onRetry
            ? [{ label: retryLabel, onPress: onRetry }]
            : []
        }
        style={[styles.banner, style]}
        contentStyle={styles.bannerContent}
      >
        {message}
      </Banner>
    );
  }

  if (variant === 'full') {
    return (
      <View style={[styles.full, style]}>
        <Text style={styles.fullIcon}>!</Text>
        <Text
          variant="bodyLarge"
          style={[styles.fullText, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
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
      <Text
        variant="bodyMedium"
        style={[styles.inlineText, { color: theme.colors.error }]}
      >
        {message}
      </Text>
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
  },

  // Banner variant
  banner: {
    backgroundColor: colors.status.errorLight,
    borderRadius: borderRadius.md,
  },
  bannerContent: {
    paddingVertical: spacing.sm,
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
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  fullButton: {
    minWidth: 120,
  },
});

export default ErrorMessage;
