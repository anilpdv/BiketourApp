import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ROUTE_CONFIGS } from '../../routes/services/routeLoader.service';
import { RouteCard } from './RouteCard';
import { colors, spacing, typography } from '../../../shared/design/tokens';

export function EuroVeloRoutesList() {
  return (
    <View>
      <Text style={styles.title}>EuroVelo Routes</Text>
      <Text style={styles.subtitle}>
        {ROUTE_CONFIGS.length} routes available
      </Text>

      {ROUTE_CONFIGS.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}

      <Text style={styles.moreText}>
        More routes coming soon - all 17 EuroVelo routes planned
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  moreText: {
    textAlign: 'center',
    color: colors.neutral[400],
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
    fontStyle: 'italic',
  },
});
