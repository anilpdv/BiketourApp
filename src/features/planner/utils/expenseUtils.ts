/**
 * Expense Utility Functions
 * Helper functions for grouping, sorting, and calculating expense data
 */
import {
  Expense,
  ExpenseCategory,
  ExpenseGroup,
  ExpenseGroupBy,
  ExpenseSortBy,
  BudgetStatus,
} from '../types';

// Category labels for display
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  accommodation: 'Accommodation',
  food: 'Food & Drinks',
  transport: 'Transport',
  repairs: 'Repairs',
  other: 'Other',
};

/**
 * Format a date string for display in group headers
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Group expenses by the specified field
 */
export function groupExpenses(
  expenses: Expense[],
  groupBy: ExpenseGroupBy
): ExpenseGroup[] {
  if (groupBy === 'none') {
    // Return all expenses as a single group
    const subtotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return [
      {
        key: 'all',
        label: 'All Expenses',
        expenses,
        subtotal,
      },
    ];
  }

  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    let key: string;
    switch (groupBy) {
      case 'day':
        key = expense.date;
        break;
      case 'category':
        key = expense.category;
        break;
      case 'country':
        key = expense.country || 'Unknown';
        break;
      default:
        key = 'other';
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(expense);
  }

  // Convert to ExpenseGroup array
  const result: ExpenseGroup[] = [];
  for (const [key, groupExpenses] of groups) {
    let label: string;
    switch (groupBy) {
      case 'day':
        label = formatDateLabel(key);
        break;
      case 'category':
        label = CATEGORY_LABELS[key as ExpenseCategory] || key;
        break;
      case 'country':
        label = key;
        break;
      default:
        label = key;
    }

    const subtotal = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    result.push({
      key,
      label,
      expenses: groupExpenses,
      subtotal,
    });
  }

  // Sort groups
  if (groupBy === 'day') {
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.key).getTime() - new Date(a.key).getTime());
  } else if (groupBy === 'category') {
    // Sort by category order
    const categoryOrder: ExpenseCategory[] = ['accommodation', 'food', 'transport', 'repairs', 'other'];
    result.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.key as ExpenseCategory);
      const bIndex = categoryOrder.indexOf(b.key as ExpenseCategory);
      return aIndex - bIndex;
    });
  } else if (groupBy === 'country') {
    // Sort alphabetically, but put "Unknown" at the end
    result.sort((a, b) => {
      if (a.key === 'Unknown') return 1;
      if (b.key === 'Unknown') return -1;
      return a.label.localeCompare(b.label);
    });
  }

  return result;
}

/**
 * Sort expenses by the specified field
 */
export function sortExpenses(
  expenses: Expense[],
  sortBy: ExpenseSortBy
): Expense[] {
  const sorted = [...expenses];

  switch (sortBy) {
    case 'date_desc':
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date_asc':
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'amount_desc':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount_asc':
      sorted.sort((a, b) => a.amount - b.amount);
      break;
  }

  return sorted;
}

/**
 * Calculate budget status for a trip
 */
export function calculateBudgetStatus(
  budget: number,
  expenses: Expense[],
  currency: string
): BudgetStatus {
  const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget - spent;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

  return {
    budget,
    spent,
    remaining,
    percentUsed,
    currency,
    isOverBudget: spent > budget,
    isNearBudget: percentUsed >= 80 && percentUsed < 100,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get sort label for display
 */
export function getSortLabel(sortBy: ExpenseSortBy): string {
  switch (sortBy) {
    case 'date_desc':
      return 'Newest First';
    case 'date_asc':
      return 'Oldest First';
    case 'amount_desc':
      return 'Highest Amount';
    case 'amount_asc':
      return 'Lowest Amount';
  }
}

/**
 * Get group by label for display
 */
export function getGroupByLabel(groupBy: ExpenseGroupBy): string {
  switch (groupBy) {
    case 'none':
      return 'No Grouping';
    case 'day':
      return 'By Day';
    case 'category':
      return 'By Category';
    case 'country':
      return 'By Country';
  }
}
