import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, Alert } from 'react-native';
import {
  Appbar,
  FAB,
  Text,
  Chip,
  Divider,
  useTheme,
  ActivityIndicator,
  Card,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ExpenseCard } from '../components/Expenses';
import { usePlannerStore, selectExpenses, selectTotalExpenses } from '../store/plannerStore';
import { Expense, ExpenseCategory, ExpenseSummary } from '../types';

type ExpenseListRouteParams = {
  ExpenseList: {
    tripPlanId: string;
  };
};

const CATEGORY_FILTERS: Array<{ key: ExpenseCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'accommodation', label: 'Stay' },
  { key: 'food', label: 'Food' },
  { key: 'transport', label: 'Transport' },
  { key: 'repairs', label: 'Repairs' },
  { key: 'other', label: 'Other' },
];

export function ExpenseListScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ExpenseListRouteParams, 'ExpenseList'>>();

  const { tripPlanId } = route.params || {};

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  const {
    expenses,
    isLoading,
    expensesLoaded,
    loadExpenses,
    deleteExpense,
    getExpenseSummary,
  } = usePlannerStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
    expensesLoaded: state.expensesLoaded,
    loadExpenses: state.loadExpenses,
    deleteExpense: state.deleteExpense,
    getExpenseSummary: state.getExpenseSummary,
  }));

  useEffect(() => {
    if (tripPlanId && !expensesLoaded) {
      loadExpenses(tripPlanId);
    }
  }, [tripPlanId, expensesLoaded, loadExpenses]);

  useEffect(() => {
    if (tripPlanId) {
      getExpenseSummary(tripPlanId).then(setSummary);
    }
  }, [tripPlanId, expenses, getExpenseSummary]);

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter((exp) => exp.category === selectedCategory);

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAddExpense = () => {
    // @ts-ignore - Navigation types need to be defined in navigation/types.ts
    navigation.navigate('AddExpense', { tripPlanId });
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${expense.category} expense of ${expense.amount} ${expense.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expense.id),
        },
      ]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const renderExpenseItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseCard
        expense={item}
        onDelete={() => handleDeleteExpense(item)}
      />
    ),
    [handleDeleteExpense]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {summary && (
        <Card style={styles.summaryCard} mode="outlined">
          <Card.Content>
            <View style={styles.summaryRow}>
              <View>
                <Text variant="labelMedium" style={styles.summaryLabel}>
                  Total Spent
                </Text>
                <Text variant="headlineSmall" style={styles.summaryAmount}>
                  {formatCurrency(summary.totalAmount, summary.currency)}
                </Text>
              </View>
              <View style={styles.summaryStats}>
                <Text variant="bodySmall" style={styles.summaryStat}>
                  Avg/day: {formatCurrency(summary.averagePerDay, summary.currency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item.key}
              onPress={() => setSelectedCategory(item.key)}
              style={styles.filterChip}
              mode="outlined"
            >
              {item.label}
            </Chip>
          )}
        />
      </View>
      <Divider style={styles.divider} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="bodyLarge" style={styles.emptyText}>
        No expenses recorded yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtext}>
        Tap the + button to add your first expense
      </Text>
    </View>
  );

  if (!tripPlanId) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Expenses" />
        </Appbar.Header>
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge">No trip selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Expenses" />
      </Appbar.Header>

      {isLoading && !expensesLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={sortedExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddExpense}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 8,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
  },
  summaryAmount: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  summaryStat: {
    color: '#666',
  },
  filterContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterChip: {
    marginHorizontal: 4,
  },
  divider: {
    marginHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
