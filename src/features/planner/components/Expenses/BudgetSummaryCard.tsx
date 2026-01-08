import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme, IconButton } from 'react-native-paper';
import { BudgetStatus, ExpenseSummary } from '../../types';
import { formatCurrency } from '../../utils/expenseUtils';
import { BudgetProgressBar } from './BudgetProgressBar';

interface BudgetSummaryCardProps {
  summary: ExpenseSummary | null;
  budgetStatus: BudgetStatus | null;
  onSetBudget: () => void;
}

export function BudgetSummaryCard({
  summary,
  budgetStatus,
  onSetBudget,
}: BudgetSummaryCardProps) {
  const theme = useTheme();

  const hasBudget = budgetStatus && budgetStatus.budget > 0;

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        {/* Header row with total and set budget button */}
        <View style={styles.header}>
          <View>
            <Text variant="labelMedium" style={styles.label}>
              Total Spent
            </Text>
            <Text variant="headlineSmall" style={styles.amount}>
              {summary
                ? formatCurrency(summary.totalAmount, summary.currency)
                : formatCurrency(0, 'EUR')}
            </Text>
          </View>
          <View style={styles.rightSection}>
            {summary && (
              <View style={styles.avgContainer}>
                <Text variant="bodySmall" style={styles.avgLabel}>
                  Avg/day
                </Text>
                <Text variant="titleSmall" style={styles.avgAmount}>
                  {formatCurrency(summary.averagePerDay, summary.currency)}
                </Text>
              </View>
            )}
            <IconButton
              icon={hasBudget ? 'pencil' : 'plus-circle-outline'}
              size={20}
              onPress={onSetBudget}
              iconColor={theme.colors.primary}
            />
          </View>
        </View>

        {/* Budget progress section */}
        {hasBudget ? (
          <View style={styles.budgetSection}>
            <BudgetProgressBar budgetStatus={budgetStatus} />
          </View>
        ) : (
          <View style={styles.noBudgetSection}>
            <Button
              mode="outlined"
              onPress={onSetBudget}
              icon="wallet-plus"
              compact
            >
              Set Trip Budget
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    color: '#666',
  },
  amount: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgContainer: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  avgLabel: {
    color: '#666',
  },
  avgAmount: {
    fontWeight: '600',
  },
  budgetSection: {
    marginTop: 16,
  },
  noBudgetSection: {
    marginTop: 12,
    alignItems: 'center',
  },
});
