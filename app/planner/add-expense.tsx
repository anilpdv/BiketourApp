import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { ExpenseForm } from '../../src/features/planner/components/Expenses';
import { usePlannerStore } from '../../src/features/planner/store/plannerStore';
import { Expense } from '../../src/features/planner/types';

export default function AddExpenseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tripPlanId, dayPlanId, date } = useLocalSearchParams<{
    tripPlanId: string;
    dayPlanId?: string;
    date?: string;
  }>();

  const { addExpense, isLoading } = usePlannerStore(
    useShallow((state) => ({
      addExpense: state.addExpense,
      isLoading: state.isLoading,
    }))
  );

  const handleSubmit = async (
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addExpense(expense);
      router.back();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!tripPlanId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge">Trip plan ID is required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ExpenseForm
        tripPlanId={tripPlanId}
        dayPlanId={dayPlanId}
        initialValues={{ date }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
