import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ExpenseForm } from '../components/Expenses';
import { usePlannerStore } from '../store/plannerStore';
import { Expense } from '../types';

type AddExpenseRouteParams = {
  AddExpense: {
    tripPlanId: string;
    dayPlanId?: string;
    date?: string;
  };
};

export function AddExpenseScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddExpenseRouteParams, 'AddExpense'>>();

  const { tripPlanId, dayPlanId, date } = route.params || {};

  const { addExpense, isLoading } = usePlannerStore((state) => ({
    addExpense: state.addExpense,
    isLoading: state.isLoading,
  }));

  const handleSubmit = async (
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addExpense(expense);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!tripPlanId) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          {/* Trip plan ID is required */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Add Expense" />
      </Appbar.Header>
      <ExpenseForm
        tripPlanId={tripPlanId}
        dayPlanId={dayPlanId}
        initialValues={{ date }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </SafeAreaView>
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
