import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { ExpenseGroup, Expense } from '../../types';
import { ExpenseCard } from './ExpenseCard';
import { formatCurrency } from '../../utils/expenseUtils';

interface ExpenseGroupSectionProps {
  group: ExpenseGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteExpense: (expense: Expense) => void;
  currency: string;
}

export function ExpenseGroupSection({
  group,
  isExpanded,
  onToggle,
  onDeleteExpense,
  currency,
}: ExpenseGroupSectionProps) {
  const theme = useTheme();

  const rotation = useDerivedValue(() => {
    return isExpanded ? 180 : 0;
  }, [isExpanded]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${withTiming(rotation.value, { duration: 200 })}deg` }],
    };
  });

  const contentHeight = useDerivedValue(() => {
    return isExpanded ? 1 : 0;
  }, [isExpanded]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(contentHeight.value, { duration: 200 }),
      maxHeight: isExpanded ? undefined : 0,
      overflow: 'hidden',
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={[styles.header, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={styles.headerContent}>
          <Text variant="titleSmall" style={styles.label}>
            {group.label}
          </Text>
          <Text variant="bodySmall" style={styles.count}>
            {group.expenses.length} item{group.expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text variant="titleSmall" style={[styles.subtotal, { color: theme.colors.primary }]}>
            {formatCurrency(group.subtotal, currency)}
          </Text>
          <Animated.View style={iconStyle}>
            <IconButton
              icon="chevron-down"
              size={20}
              onPress={onToggle}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={contentStyle}>
        {isExpanded && (
          <View style={styles.content}>
            {group.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={() => onDeleteExpense(expense)}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
  },
  count: {
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtotal: {
    fontWeight: '600',
    marginRight: 4,
  },
  content: {
    paddingTop: 4,
  },
});
