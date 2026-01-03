import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParsedRoute } from '../../routes/types';
import { getRouteName } from '../../routes/services/routeLoader.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface RouteInfoCardProps {
  route: ParsedRoute;
  developedRoute?: ParsedRoute;
}

/**
 * Bottom card showing selected route information
 */
export const RouteInfoCard = memo(function RouteInfoCard({
  route,
  developedRoute,
}: RouteInfoCardProps) {
  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${Math.round(km)} km`;
  };

  const formatElevation = (meters: number) => {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}k m` : `${Math.round(meters)} m`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{getRouteName(route.euroVeloId)}</Text>
      <Text style={styles.details}>
        Europe • {formatDistance(route.totalDistance)}
      </Text>
      {route.elevationGain !== undefined && (
        <Text style={styles.elevation}>
          <Text style={styles.elevationGain}>↑ {formatElevation(route.elevationGain)}</Text>
          {' • '}
          <Text style={styles.elevationLoss}>↓ {formatElevation(route.elevationLoss || 0)}</Text>
        </Text>
      )}

      {/* Route legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: route.color }]} />
          <Text style={styles.legendText}>Full Route</Text>
        </View>
        {developedRoute && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, styles.legendLineDashed, { backgroundColor: developedRoute.color }]} />
            <Text style={styles.legendText}>Developed</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  name: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  details: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  elevation: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  elevationGain: {
    color: colors.elevation.gain,
  },
  elevationLoss: {
    color: colors.elevation.loss,
  },
  legend: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  legendLineDashed: {
    // Visual indicator for developed route
    opacity: 0.8,
  },
  legendText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
});
