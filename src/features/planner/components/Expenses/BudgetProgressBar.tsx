import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { BudgetStatus } from '../../types';
import { formatCurrency } from '../../utils/expenseUtils';

interface BudgetProgressBarProps {
  budgetStatus: BudgetStatus;
  showLabels?: boolean;
}

export function BudgetProgressBar({ budgetStatus, showLabels = true }: BudgetProgressBarProps) {
  const theme = useTheme();

  const { budget, spent, remaining, percentUsed, currency, isOverBudget, isNearBudget } = budgetStatus;

  // Determine color based on budget status
  const getProgressColor = () => {
    if (isOverBudget) return '#f44336'; // Red
    if (isNearBudget) return '#FF9800'; // Orange
    return theme.colors.primary; // Green
  };

  const progressWidth = useDerivedValue(() => {
    return Math.min(percentUsed, 100);
  }, [percentUsed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${withSpring(progressWidth.value, { damping: 15, stiffness: 100 })}%`,
    };
  });

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labels}>
          <Text variant="bodySmall" style={styles.spentLabel}>
            Spent: {formatCurrency(spent, currency)}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.remainingLabel,
              { color: isOverBudget ? '#f44336' : '#666' },
            ]}
          >
            {isOverBudget ? 'Over by: ' : 'Remaining: '}
            {formatCurrency(Math.abs(remaining), currency)}
          </Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: getProgressColor() },
              animatedStyle,
            ]}
          />
        </View>
        <Text variant="labelSmall" style={styles.percentLabel}>
          {percentUsed.toFixed(0)}%
        </Text>
      </View>

      {showLabels && (
        <View style={styles.budgetLabel}>
          <Text variant="bodySmall" style={styles.budgetText}>
            Budget: {formatCurrency(budget, currency)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  spentLabel: {
    fontWeight: '500',
  },
  remainingLabel: {
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentLabel: {
    width: 36,
    textAlign: 'right',
    color: '#666',
  },
  budgetLabel: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  budgetText: {
    color: '#999',
  },
});
