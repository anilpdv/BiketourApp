import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { ExpenseGroupBy, ExpenseSortBy } from '../../types';

interface GroupSortControlsProps {
  groupBy: ExpenseGroupBy;
  sortBy: ExpenseSortBy;
  onGroupByChange: (value: ExpenseGroupBy) => void;
  onSortByChange: (value: ExpenseSortBy) => void;
}

const GROUP_OPTIONS: { value: ExpenseGroupBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'day', label: 'Day' },
  { value: 'category', label: 'Category' },
  { value: 'country', label: 'Country' },
];

const SORT_OPTIONS: { value: ExpenseSortBy; label: string; icon: string }[] = [
  { value: 'date_desc', label: 'Newest', icon: 'sort-calendar-descending' },
  { value: 'date_asc', label: 'Oldest', icon: 'sort-calendar-ascending' },
  { value: 'amount_desc', label: 'High $', icon: 'sort-numeric-descending' },
  { value: 'amount_asc', label: 'Low $', icon: 'sort-numeric-ascending' },
];

export function GroupSortControls({
  groupBy,
  sortBy,
  onGroupByChange,
  onSortByChange,
}: GroupSortControlsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="labelMedium" style={styles.label}>
          Group by
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {GROUP_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={groupBy === option.value}
              onPress={() => onGroupByChange(option.value)}
              style={styles.chip}
              mode="outlined"
              compact
            >
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="labelMedium" style={styles.label}>
          Sort by
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={sortBy === option.value}
              onPress={() => onSortByChange(option.value)}
              style={styles.chip}
              mode="outlined"
              compact
              icon={option.icon}
            >
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  section: {
    gap: 6,
  },
  label: {
    color: '#666',
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 32,
  },
});
