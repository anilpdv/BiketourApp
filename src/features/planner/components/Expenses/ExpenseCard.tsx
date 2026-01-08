import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { Expense, ExpenseCategory } from '../../types';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onDelete?: () => void;
}

const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  accommodation: { icon: 'bed', color: '#4CAF50', label: 'Accommodation' },
  food: { icon: 'food', color: '#FF9800', label: 'Food' },
  transport: { icon: 'train', color: '#2196F3', label: 'Transport' },
  repairs: { icon: 'wrench', color: '#9C27B0', label: 'Repairs' },
  other: { icon: 'dots-horizontal', color: '#607D8B', label: 'Other' },
};

export function ExpenseCard({ expense, onPress, onDelete }: ExpenseCardProps) {
  const theme = useTheme();
  const categoryConfig = CATEGORY_CONFIG[expense.category];

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if description is meaningful (not same as category label)
  const hasCustomDescription = expense.description &&
    expense.description.toLowerCase() !== categoryConfig.label.toLowerCase() &&
    expense.description.toLowerCase() !== expense.category.toLowerCase();

  // Title is custom description or category label
  const title = hasCustomDescription ? expense.description : categoryConfig.label;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.content}>
          <View style={styles.leftSection}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: categoryConfig.color + '20' },
              ]}
            >
              <IconButton
                icon={categoryConfig.icon}
                iconColor={categoryConfig.color}
                size={20}
              />
            </View>
            <View style={styles.details}>
              <Text variant="titleMedium" style={styles.description}>
                {title}
              </Text>
              <View style={styles.metaRow}>
                {hasCustomDescription && (
                  <Text variant="bodySmall" style={styles.category}>
                    {categoryConfig.label}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.date}>
                  {formatDate(expense.date)}
                </Text>
                {expense.country && (
                  <Text variant="bodySmall" style={styles.country}>
                    {expense.country}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Text variant="titleMedium" style={styles.amount}>
              {formatAmount(expense.amount, expense.currency)}
            </Text>
            {onDelete && (
              <IconButton
                icon="delete-outline"
                iconColor={theme.colors.error}
                size={18}
                onPress={onDelete}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    borderRadius: 20,
    marginRight: 8,
  },
  details: {
    flex: 1,
  },
  description: {
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  category: {
    color: '#666',
  },
  date: {
    color: '#999',
  },
  country: {
    color: '#999',
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
  },
});
