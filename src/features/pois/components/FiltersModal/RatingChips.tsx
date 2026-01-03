import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../shared/design/tokens';

const RATING_OPTIONS = [
  { value: 3.5, label: '3.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

interface RatingChipsProps {
  selectedRating: number | null;
  onSelect: (rating: number | null) => void;
}

export const RatingChips = memo(function RatingChips({
  selectedRating,
  onSelect,
}: RatingChipsProps) {
  const handleSelect = (rating: number) => {
    // Toggle off if already selected
    if (selectedRating === rating) {
      onSelect(null);
    } else {
      onSelect(rating);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Number of reviews</Text>
      <View style={styles.chipsContainer}>
        {RATING_OPTIONS.map((option) => {
          const isSelected = selectedRating === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Rating ${option.label}${isSelected ? ', selected' : ''}`}
            >
              <MaterialCommunityIcons
                name="star"
                size={16}
                color={isSelected ? colors.status.warning : colors.neutral[400]}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option.label}
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
  sectionTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[800],
  },
  chipText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  chipTextSelected: {
    color: colors.neutral[800],
  },
});

export default RatingChips;
