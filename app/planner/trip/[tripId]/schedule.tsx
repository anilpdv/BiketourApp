import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlannerStore, selectTripPlanById } from '../../../../src/features/planner/store/plannerStore';
import { DayPlanCard } from '../../../../src/features/planner/components/DayPlanCard';
import { DayPlan } from '../../../../src/features/planner/types';
import { spacing } from '../../../../src/shared/design/tokens';

export default function TripScheduleTab() {
  const theme = useTheme();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));
  const { completeTripDayPlan } = usePlannerStore();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  if (!tripPlan) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="bodyLarge">Trip not found</Text>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          Go Back
        </Button>
      </View>
    );
  }

  const handleMarkDayComplete = (dayPlan: DayPlan) => {
    Alert.prompt(
      'Complete Day',
      `Enter actual km ridden (target: ${dayPlan.targetKm} km)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: (actualKm: string | undefined) => {
            const km = parseFloat(actualKm || String(dayPlan.targetKm));
            if (!isNaN(km)) {
              completeTripDayPlan(tripPlan.id, dayPlan.id, km);
            }
          },
        },
      ],
      'plain-text',
      String(dayPlan.targetKm)
    );
  };

  const handleAddDayExpense = (dayPlan: DayPlan) => {
    router.push({
      pathname: '/planner/add-expense',
      params: {
        tripPlanId: tripId,
        dayPlanId: dayPlan.id,
        date: dayPlan.date,
      },
    });
  };

  const renderDayPlan = ({ item, index }: { item: DayPlan; index: number }) => {
    const isToday = item.date === today;
    const canComplete = item.status === 'planned' || item.status === 'in_progress';

    return (
      <DayPlanCard
        dayPlan={item}
        dayNumber={index + 1}
        isToday={isToday}
        onMarkComplete={canComplete ? () => handleMarkDayComplete(item) : undefined}
        onAddExpense={() => handleAddDayExpense(item)}
        showAddExpense
      />
    );
  };

  return (
    <FlatList
      data={tripPlan.dayPlans}
      keyExtractor={(item) => item.id}
      renderItem={renderDayPlan}
      contentContainerStyle={styles.listContent}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      ListHeaderComponent={
        <Text variant="bodySmall" style={[styles.headerText, { color: theme.colors.onSurfaceVariant }]}>
          {tripPlan.dayPlans.length} days planned
        </Text>
      }
    />
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  headerText: {
    marginBottom: spacing.md,
  },
});
