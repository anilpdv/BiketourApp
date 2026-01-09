import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpenseCategory } from '../../types';
import { colors, spacing } from '../../../../shared/design/tokens';

interface CategorySelectorProps {
  selected: ExpenseCategory;
  onSelect: (category: ExpenseCategory) => void;
}

const CATEGORY_CONFIG: Array<{
  key: ExpenseCategory;
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}> = [
  {
    key: 'food',
    icon: 'silverware-fork-knife',
    label: 'Food',
    color: '#FF9800',
    bgColor: '#FFF3E0',
  },
  {
    key: 'accommodation',
    icon: 'bed',
    label: 'Stay',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  {
    key: 'transport',
    icon: 'train',
    label: 'Transport',
    color: '#2196F3',
    bgColor: '#E3F2FD',
  },
  {
    key: 'repairs',
    icon: 'wrench',
    label: 'Repairs',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
  },
  {
    key: 'other',
    icon: 'tag-outline',
    label: 'Custom',
    color: '#607D8B',
    bgColor: '#ECEFF1',
  },
];

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORY_CONFIG.map((cat) => {
          const isSelected = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryButton}
              onPress={() => onSelect(cat.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryIconCircle,
                  {
                    backgroundColor: isSelected ? cat.color : cat.bgColor,
                    borderColor: isSelected ? cat.color : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={24}
                  color={isSelected ? '#fff' : cat.color}
                />
              </View>

              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && { color: cat.color, fontWeight: '700' },
                ]}
              >
                {cat.label}
              </Text>

              {isSelected && (
                <View
                  style={[styles.selectionDot, { backgroundColor: cat.color }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  categoryButton: {
    alignItems: 'center',
    width: 64,
    paddingVertical: spacing.xs,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[600],
    textAlign: 'center',
  },
  selectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
