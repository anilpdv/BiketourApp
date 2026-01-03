import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../shared/design/tokens';

const PRICE_OPTIONS = [
  { value: 15, label: '€15' },
  { value: 25, label: '€25' },
  { value: 50, label: '€50' },
  { value: null, label: 'Any' },
];

interface PriceRangeSliderProps {
  value: number | null;
  onChange: (price: number | null) => void;
  min?: number;
  max?: number;
  currency?: string;
}

export const PriceRangeSlider = memo(function PriceRangeSlider({
  value,
  onChange,
}: PriceRangeSliderProps) {
  const displayValue = value === null ? 'Any' : `€0 - €${value}`;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Price</Text>
        <Text style={styles.priceValue}>{displayValue}</Text>
      </View>

      <View style={styles.chipsContainer}>
        {PRICE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Max price ${option.label}${isSelected ? ', selected' : ''}`}
            >
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option.value === null ? option.label : `Max ${option.label}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  priceValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.secondary[600],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[500],
  },
  chipText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  chipTextSelected: {
    color: colors.secondary[700],
  },
});

export default PriceRangeSlider;
