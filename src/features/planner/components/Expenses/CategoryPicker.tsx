import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { ExpenseCategory } from '../../types';

interface CategoryPickerProps {
  selectedCategory: ExpenseCategory;
  onCategoryChange: (category: ExpenseCategory) => void;
}

const CATEGORIES: Array<{
  key: ExpenseCategory;
  icon: string;
  color: string;
  label: string;
}> = [
  { key: 'accommodation', icon: 'bed', color: '#4CAF50', label: 'Accommodation' },
  { key: 'food', icon: 'food', color: '#FF9800', label: 'Food' },
  { key: 'transport', icon: 'train', color: '#2196F3', label: 'Transport' },
  { key: 'repairs', icon: 'wrench', color: '#9C27B0', label: 'Repairs' },
  { key: 'other', icon: 'dots-horizontal', color: '#607D8B', label: 'Other' },
];

export function CategoryPicker({
  selectedCategory,
  onCategoryChange,
}: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Category
      </Text>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.key;
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                isSelected && {
                  backgroundColor: category.color + '20',
                  borderColor: category.color,
                },
              ]}
              onPress={() => onCategoryChange(category.key)}
            >
              <IconButton
                icon={category.icon}
                iconColor={isSelected ? category.color : '#999'}
                size={24}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.categoryLabel,
                  isSelected && { color: category.color },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    minWidth: 90,
  },
  categoryLabel: {
    color: '#666',
    marginTop: -4,
  },
});
