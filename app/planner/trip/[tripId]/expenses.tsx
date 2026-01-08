import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, SectionList, Alert } from 'react-native';
import {
  FAB,
  Text,
  Chip,
  Divider,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTripContext } from './TripContext';
import { useShallow } from 'zustand/react/shallow';
import {
  ExpenseCard,
  GroupSortControls,
  ExpenseGroupSection,
  BudgetSummaryCard,
  BudgetSetupModal,
  ExpenseCharts,
} from '../../../../src/features/planner/components/Expenses';
import { usePlannerStore, selectTripPlanById } from '../../../../src/features/planner/store/plannerStore';
import {
  Expense,
  ExpenseCategory,
  ExpenseSummary,
  ExpenseGroupBy,
  ExpenseSortBy,
  ExpenseGroup,
  BudgetStatus,
} from '../../../../src/features/planner/types';
import {
  groupExpenses,
  sortExpenses,
} from '../../../../src/features/planner/utils/expenseUtils';

const CATEGORY_FILTERS: Array<{ key: ExpenseCategory | 'all'; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: 'view-grid' },
  { key: 'accommodation', label: 'Stay', icon: 'bed' },
  { key: 'food', label: 'Food', icon: 'food' },
  { key: 'transport', label: 'Transport', icon: 'train' },
  { key: 'repairs', label: 'Repairs', icon: 'wrench' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export default function TripExpensesTab() {
  const theme = useTheme();
  const router = useRouter();
  const { tripId } = useTripContext();

  // State for filtering, grouping, and sorting
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [groupBy, setGroupBy] = useState<ExpenseGroupBy>('none');
  const [sortBy, setSortBy] = useState<ExpenseSortBy>('date_desc');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showCharts, setShowCharts] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Get trip plan for budget info
  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));

  const {
    expenses,
    isLoading,
    expensesLoaded,
    loadExpenses,
    deleteExpense,
    getExpenseSummary,
    updateTripBudget,
    getBudgetStatus,
  } = usePlannerStore(
    useShallow((state) => ({
      expenses: state.expenses,
      isLoading: state.isLoading,
      expensesLoaded: state.expensesLoaded,
      loadExpenses: state.loadExpenses,
      deleteExpense: state.deleteExpense,
      getExpenseSummary: state.getExpenseSummary,
      updateTripBudget: state.updateTripBudget,
      getBudgetStatus: state.getBudgetStatus,
    }))
  );

  // Always reload expenses when tripId changes
  useEffect(() => {
    if (tripId) {
      loadExpenses(tripId);
    }
  }, [tripId, loadExpenses]);

  useEffect(() => {
    if (tripId) {
      getExpenseSummary(tripId).then(setSummary);
    }
  }, [tripId, expenses, getExpenseSummary]);

  // Get budget status
  const budgetStatus = useMemo(() => {
    if (!tripId) return null;
    return getBudgetStatus(tripId);
  }, [tripId, getBudgetStatus, expenses, tripPlan?.budget]);

  // Filter expenses by tripId and category
  const filteredExpenses = useMemo(() => {
    // First filter by current trip
    const tripExpenses = expenses.filter((exp) => exp.tripPlanId === tripId);
    // Then filter by category if selected
    return selectedCategory === 'all'
      ? tripExpenses
      : tripExpenses.filter((exp) => exp.category === selectedCategory);
  }, [expenses, selectedCategory, tripId]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    return sortExpenses(filteredExpenses, sortBy);
  }, [filteredExpenses, sortBy]);

  // Group expenses
  const groupedExpenses = useMemo(() => {
    return groupExpenses(sortedExpenses, groupBy);
  }, [sortedExpenses, groupBy]);

  // Expand all sections by default when groupBy changes
  useEffect(() => {
    if (groupBy !== 'none') {
      setExpandedSections(new Set(groupedExpenses.map((g) => g.key)));
    }
  }, [groupBy]);

  const handleAddExpense = () => {
    router.push(`/planner/add-expense?tripPlanId=${tripId}`);
  };

  const handleDeleteExpense = useCallback((expense: Expense) => {
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
  }, [deleteExpense]);

  const handleToggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSaveBudget = useCallback(async (budget: number, currency: string) => {
    if (tripId) {
      await updateTripBudget(tripId, budget, currency);
    }
  }, [tripId, updateTripBudget]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Budget Summary Card */}
      <BudgetSummaryCard
        summary={summary}
        budgetStatus={budgetStatus}
        onSetBudget={() => setShowBudgetModal(true)}
      />

      {/* Charts Section (Collapsible) */}
      {summary && summary.totalAmount > 0 && (
        <ExpenseCharts
          summary={summary}
          budget={tripPlan?.budget}
          isExpanded={showCharts}
          onToggle={() => setShowCharts(!showCharts)}
        />
      )}

      {/* Group and Sort Controls */}
      <GroupSortControls
        groupBy={groupBy}
        sortBy={sortBy}
        onGroupByChange={setGroupBy}
        onSortByChange={setSortBy}
      />

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <SectionList
          horizontal
          sections={[{ data: CATEGORY_FILTERS }]}
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
          renderSectionHeader={() => null}
          contentContainerStyle={styles.filterContent}
        />
      </View>
      <Divider style={styles.divider} />
    </View>
  );

  const renderGroupedList = () => {
    if (groupBy === 'none') {
      // Render flat list when not grouping
      return (
        <>
          {sortedExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onDelete={() => handleDeleteExpense(expense)}
            />
          ))}
        </>
      );
    }

    // Render grouped sections
    return (
      <>
        {groupedExpenses.map((group) => (
          <ExpenseGroupSection
            key={group.key}
            group={group}
            isExpanded={expandedSections.has(group.key)}
            onToggle={() => handleToggleSection(group.key)}
            onDeleteExpense={handleDeleteExpense}
            currency={summary?.currency || 'EUR'}
          />
        ))}
      </>
    );
  };

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

  if (!tripPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge">Trip not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading && !expensesLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <SectionList
          sections={[{ data: [1] }]} // Dummy section to enable header
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={() => (
            <View style={styles.listContent}>
              {sortedExpenses.length === 0 ? renderEmpty() : renderGroupedList()}
            </View>
          )}
          renderSectionHeader={() => null}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.scrollContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddExpense}
        color={theme.colors.onPrimary}
      />

      <BudgetSetupModal
        visible={showBudgetModal}
        onDismiss={() => setShowBudgetModal(false)}
        onSave={handleSaveBudget}
        initialBudget={tripPlan?.budget}
        initialCurrency={tripPlan?.budgetCurrency || 'EUR'}
      />
    </View>
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
  filterContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    marginHorizontal: 4,
  },
  divider: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  listContent: {
    paddingTop: 8,
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
