import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { colors, spacing } from '../../design/tokens';

export type LoadingSpinnerSize = 'small' | 'large';

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  color?: string;
  message?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color,
  message,
  overlay = false,
  style,
}: LoadingSpinnerProps) {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;

  const content = (
    <>
      <ActivityIndicator
        animating
        size={size}
        color={spinnerColor}
      />
      {message && (
        <Text
          variant="bodyLarge"
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      )}
    </>
  );

  if (overlay) {
    return (
      <View style={[styles.overlay, style]}>
        {content}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay.light,
  },
  message: {
    marginTop: spacing.md,
  },
});

export default LoadingSpinner;
