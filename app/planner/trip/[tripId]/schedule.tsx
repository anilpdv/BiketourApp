import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTripContext } from './TripContext';
import { usePlannerStore, selectTripPlanById } from '../../../../src/features/planner/store/plannerStore';
import { DayPlanCard } from '../../../../src/features/planner/components/DayPlanCard';
import { EditDayPlanSheet } from '../../../../src/features/planner/components/EditDayPlanSheet';
import { DayPlan } from '../../../../src/features/planner/types';
import { getDayPlanDates } from '../../../../src/features/planner/utils/dayPlanUtils';
import { spacing } from '../../../../src/shared/design/tokens';

export default function TripScheduleTab() {
  const theme = useTheme();
  const router = useRouter();
  const { tripId } = useTripContext();

  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));
  const { completeTripDayPlan, updateDayPlan, addRestDay, removeDayPlan } = usePlannerStore();

  // Edit sheet state
  const [editingDayPlan, setEditingDayPlan] = useState<DayPlan | null>(null);
  const [editingDayNumber, setEditingDayNumber] = useState(0);

  // Get local date in YYYY-MM-DD format (not UTC)
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get all existing dates for conflict detection
  const existingDates = useMemo(
    () => (tripPlan ? getDayPlanDates(tripPlan.dayPlans) : []),
    [tripPlan?.dayPlans]
  );

  // Edit sheet handlers
  const handleEditDay = useCallback((dayPlan: DayPlan, dayNumber: number) => {
    setEditingDayPlan(dayPlan);
    setEditingDayNumber(dayNumber);
  }, []);

  const handleDismissEdit = useCallback(() => {
    setEditingDayPlan(null);
    setEditingDayNumber(0);
  }, []);

  const handleSaveDayPlan = useCallback(
    async (dayPlanId: string, updates: Partial<DayPlan>) => {
      if (!tripId) return { success: false, error: 'No trip ID' };
      return updateDayPlan(tripId, dayPlanId, updates);
    },
    [tripId, updateDayPlan]
  );

  const handleDeleteDayPlan = useCallback(
    async (dayPlanId: string) => {
      if (!tripId) return { success: false, error: 'No trip ID' };
      return removeDayPlan(tripId, dayPlanId);
    },
    [tripId, removeDayPlan]
  );

  const handleAddRestDay = useCallback(
    async (afterDayPlanId: string) => {
      if (!tripId) return { success: false, error: 'No trip ID' };
      return addRestDay(tripId, afterDayPlanId);
    },
    [tripId, addRestDay]
  );

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
    const dayNumber = index + 1;
    const isToday = item.date === today;
    const canComplete = item.status === 'planned' || item.status === 'in_progress';

    return (
      <DayPlanCard
        dayPlan={item}
        dayNumber={dayNumber}
        isToday={isToday}
        onPress={() => handleEditDay(item, dayNumber)}
        onMarkComplete={canComplete ? () => handleMarkDayComplete(item) : undefined}
        onAddExpense={() => handleAddDayExpense(item)}
        showAddExpense
      />
    );
  };

  return (
    <>
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
      <EditDayPlanSheet
        visible={editingDayPlan !== null}
        dayPlan={editingDayPlan}
        dayNumber={editingDayNumber}
        tripId={tripId || ''}
        onDismiss={handleDismissEdit}
        onSave={handleSaveDayPlan}
        onDelete={handleDeleteDayPlan}
        onAddRestDay={handleAddRestDay}
        existingDates={existingDates}
        canDelete={tripPlan.dayPlans.length > 1}
      />
    </>
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
