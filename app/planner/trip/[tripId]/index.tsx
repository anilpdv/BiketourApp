import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, ProgressBar, Chip } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlannerStore, selectTripPlanById } from '../../../../src/features/planner/store/plannerStore';
import { DayPlanCard } from '../../../../src/features/planner/components/DayPlanCard';
import { calculateTripStats } from '../../../../src/features/planner/services/euroveloPlanningService';
import { getRouteName, getRouteColor } from '../../../../src/features/routes/services/routeLoader.service';
import { colors, spacing, borderRadius } from '../../../../src/shared/design/tokens';

export default function TripOverviewTab() {
  const theme = useTheme();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));
  const { completeTripDayPlan } = usePlannerStore();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const stats = useMemo(() => {
    if (!tripPlan) return null;
    return calculateTripStats(tripPlan);
  }, [tripPlan]);

  const { todayPlan, todayIndex, upcomingPlans } = useMemo(() => {
    if (!tripPlan) {
      return { todayPlan: null, todayIndex: -1, upcomingPlans: [] };
    }

    const dayPlans = tripPlan.dayPlans;
    const todayIdx = dayPlans.findIndex((p) => p.date === today);
    const todayP = todayIdx >= 0 ? dayPlans[todayIdx] : null;

    const startIdx = todayIdx >= 0 ? todayIdx + 1 : 0;
    const upcoming = dayPlans.slice(startIdx, startIdx + 2);

    return {
      todayPlan: todayP,
      todayIndex: todayIdx,
      upcomingPlans: upcoming,
    };
  }, [tripPlan, today]);

  if (!tripPlan) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="bodyLarge">Trip not found</Text>
      </View>
    );
  }

  const routeColor = getRouteColor(tripPlan.euroVeloId, tripPlan.variant);
  const routeName = getRouteName(tripPlan.euroVeloId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkComplete = async () => {
    if (todayPlan) {
      await completeTripDayPlan(tripPlan.id, todayPlan.id, todayPlan.targetKm);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Trip Summary Card */}
      <Surface style={styles.summaryCard} elevation={2}>
        <View style={styles.summaryHeader}>
          <View style={[styles.routeIndicator, { backgroundColor: routeColor }]} />
          <View style={styles.summaryHeaderText}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              EuroVelo {tripPlan.euroVeloId} - {routeName}
            </Text>
          </View>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: `${routeColor}20` }}
            textStyle={{ color: routeColor, textTransform: 'capitalize', fontSize: 12 }}
          >
            {tripPlan.status}
          </Chip>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              {stats ? Math.round(stats.completedKm) : 0}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              km done
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ fontWeight: '600' }}>
              {Math.round(tripPlan.totalDistanceKm)}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              km total
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ fontWeight: '600' }}>
              {tripPlan.estimatedDays}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              days
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="labelMedium">Progress</Text>
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
              {stats ? Math.round(stats.progressPercent) : 0}%
            </Text>
          </View>
          <ProgressBar
            progress={(stats?.progressPercent || 0) / 100}
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
      </Surface>

      {/* Today's Ride */}
      {todayPlan && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Today's Ride
          </Text>
          <DayPlanCard
            dayPlan={todayPlan}
            dayNumber={todayIndex + 1}
            isToday
            onMarkComplete={todayPlan.status === 'planned' ? handleMarkComplete : undefined}
          />
        </View>
      )}

      {/* Upcoming Days */}
      {upcomingPlans.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming
          </Text>
          {upcomingPlans.map((plan, index) => {
            const dayNum = todayIndex >= 0 ? todayIndex + 2 + index : index + 1;
            return (
              <DayPlanCard
                key={plan.id}
                dayPlan={plan}
                dayNumber={dayNum}
              />
            );
          })}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  summaryHeaderText: {
    flex: 1,
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
    height: 40,
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});
