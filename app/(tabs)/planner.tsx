import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, useTheme, Button as PaperButton, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorBoundary } from '../../src/shared/components';
import { usePlannerStore } from '../../src/features/planner/store/plannerStore';
import { TripCard } from '../../src/features/planner/components/TripCard';
import { EuroVeloTripPlan } from '../../src/features/planner/types';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

export default function PlannerScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { tripPlans, tripPlansLoaded, loadTripPlans, activeTripPlan } = usePlannerStore();

  useEffect(() => {
    if (!tripPlansLoaded) {
      loadTripPlans();
    }
  }, [tripPlansLoaded, loadTripPlans]);

  const handleCreateTrip = () => {
    router.push('/planner/create-trip');
  };

  const handleTripPress = (trip: EuroVeloTripPlan) => {
    router.push(`/planner/trip/${trip.id}`);
  };

  // Sort trips: active first, then by updated date
  const sortedTrips = [...tripPlans].sort((a, b) => {
    // Active trip first
    if (activeTripPlan?.id === a.id) return -1;
    if (activeTripPlan?.id === b.id) return 1;
    // Then by status (active > planning > paused > completed)
    const statusOrder = { active: 0, planning: 1, paused: 2, completed: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    // Then by updated date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const renderTripItem = ({ item }: { item: EuroVeloTripPlan }) => (
    <TripCard
      tripPlan={item}
      onPress={() => handleTripPress(item)}
      isActive={activeTripPlan?.id === item.id}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
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
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text variant="titleLarge" style={styles.headerTitle}>
        Your Trips
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {tripPlans.length} {tripPlans.length === 1 ? 'trip' : 'trips'}
      </Text>
    </View>
  );

  // Empty state - no trips
  if (tripPlans.length === 0) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {renderEmptyState()}
        </View>
      </ErrorBoundary>
    );
  }

  // Trip list view
  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={sortedTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
        />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateTrip}
          color={theme.colors.onPrimary}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },
  emptyContainer: {
    flex: 1,
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
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
