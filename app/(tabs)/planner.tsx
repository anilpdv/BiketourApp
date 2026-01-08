import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Button as PaperButton, IconButton } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorBoundary } from '../../src/shared/components';
import { usePlannerStore } from '../../src/features/planner/store/plannerStore';
import { TripCard } from '../../src/features/planner/components/TripCard';
import { DayPlanCard } from '../../src/features/planner/components/DayPlanCard';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

export default function PlannerScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { activeTripPlan, tripPlans, completeTripDayPlan, setActiveTripPlan } = usePlannerStore();

  // Get today's date in ISO format
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Find today's day plan and upcoming days
  const { todayPlan, todayIndex, upcomingPlans } = useMemo(() => {
    if (!activeTripPlan) {
      return { todayPlan: null, todayIndex: -1, upcomingPlans: [] };
    }

    const dayPlans = activeTripPlan.dayPlans;
    const todayIdx = dayPlans.findIndex((p) => p.date === today);
    const todayP = todayIdx >= 0 ? dayPlans[todayIdx] : null;

    // Get next 3 upcoming days (after today)
    const startIdx = todayIdx >= 0 ? todayIdx + 1 : 0;
    const upcoming = dayPlans.slice(startIdx, startIdx + 3);

    return {
      todayPlan: todayP,
      todayIndex: todayIdx,
      upcomingPlans: upcoming,
    };
  }, [activeTripPlan, today]);

  const handleCreateTrip = () => {
    router.push('/planner/create-trip');
  };

  const handleViewTripDetails = () => {
    if (activeTripPlan) {
      router.push(`/planner/trip/${activeTripPlan.id}`);
    }
  };

  const handleMarkComplete = async () => {
    if (activeTripPlan && todayPlan) {
      await completeTripDayPlan(activeTripPlan.id, todayPlan.id, todayPlan.targetKm);
    }
  };

  // Empty state - no active trip
  if (!activeTripPlan) {
    return (
      <ErrorBoundary>
        <Stack.Screen options={{ headerRight: undefined }} />
        <ScrollView
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.emptyContainer}
        >
          <Surface style={styles.emptyCard} elevation={2}>
            <MaterialCommunityIcons
              name="bike-fast"
              size={64}
              color={theme.colors.primary}
            />
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Plan Your Bike Tour
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Select a EuroVelo route and set your daily distance target to
              automatically generate a day-by-day riding schedule.
            </Text>
            <PaperButton
              mode="contained"
              onPress={handleCreateTrip}
              style={styles.createButton}
              icon="plus"
            >
              Create Trip Plan
            </PaperButton>
          </Surface>

          {tripPlans.length > 0 && (
            <View style={styles.previousTripsSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Previous Trips
              </Text>
              {tripPlans.slice(0, 3).map((trip) => (
                <TripCard
                  key={trip.id}
                  tripPlan={trip}
                  onPress={() => router.push(`/planner/trip/${trip.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ErrorBoundary>
    );
  }

  // Active trip view
  return (
    <ErrorBoundary>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="close"
              iconColor={theme.colors.onPrimary}
              onPress={() => setActiveTripPlan(null)}
            />
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Active Trip Card */}
        <View style={styles.section}>
          <TripCard tripPlan={activeTripPlan} onPress={handleViewTripDetails} />
        </View>

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
              onMarkComplete={handleMarkComplete}
            />
          </View>
        )}

        {/* Upcoming Days */}
        {upcomingPlans.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Upcoming Days
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

        {/* View Full Schedule Button */}
        <View style={styles.actionsSection}>
          <PaperButton
            mode="outlined"
            onPress={handleViewTripDetails}
            icon="calendar-text"
          >
            View Full Schedule
          </PaperButton>
          <PaperButton
            mode="outlined"
            onPress={() => router.push(`/planner/expenses?tripPlanId=${activeTripPlan.id}`)}
            icon="wallet-outline"
          >
            Trip Expenses
          </PaperButton>
          <PaperButton
            mode="text"
            onPress={handleCreateTrip}
            icon="plus"
          >
            Create New Trip
          </PaperButton>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  previousTripsSection: {
    marginTop: spacing.xl,
  },
  actionsSection: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
