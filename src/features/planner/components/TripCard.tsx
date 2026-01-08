import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EuroVeloTripPlan } from '../types';
import { calculateTripStats } from '../services/euroveloPlanningService';
import { getRouteName, getRouteColor } from '../../routes/services/routeLoader.service';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

interface TripCardProps {
  tripPlan: EuroVeloTripPlan;
  onPress?: () => void;
}

export function TripCard({ tripPlan, onPress }: TripCardProps) {
  const theme = useTheme();
  const stats = calculateTripStats(tripPlan);
  const routeColor = getRouteColor(tripPlan.euroVeloId, tripPlan.variant);
  const routeName = getRouteName(tripPlan.euroVeloId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.routeIndicator, { backgroundColor: routeColor }]} />
        <View style={styles.headerText}>
          <Text variant="titleMedium" style={styles.tripName}>
            {tripPlan.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            EuroVelo {tripPlan.euroVeloId} - {routeName}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
            {Math.round(stats.completedKm)}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            km done
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
            {Math.round(tripPlan.totalDistanceKm)}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            km total
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
            {stats.completedDays}/{tripPlan.estimatedDays}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            days
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Progress
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {Math.round(stats.progressPercent)}%
          </Text>
        </View>
        <ProgressBar
          progress={stats.progressPercent / 100}
          color={routeColor}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.dateRow}>
        <MaterialCommunityIcons
          name="calendar-range"
          size={16}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.xs }}>
          {formatDate(tripPlan.startDate)} - {tripPlan.endDate ? formatDate(tripPlan.endDate) : 'TBD'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  tripName: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.neutral[200],
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
