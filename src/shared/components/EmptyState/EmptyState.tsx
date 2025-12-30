import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Button } from '../Button';
import { spacing } from '../../design/tokens';

export interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text
        variant="headlineSmall"
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {subtitle}
        </Text>
      )}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.lg,
    minWidth: 150,
  },
});

export default EmptyState;
