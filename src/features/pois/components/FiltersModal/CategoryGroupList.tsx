import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POI_CATEGORY_GROUPS } from '../../config/poiCategories';
import {
  CATEGORY_TO_VECTOR_ICON,
  CATEGORY_NAMES,
} from '../../config/poiIcons';
import { POICategory } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../shared/design/tokens';

interface CategoryGroupListProps {
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
}

/**
 * CategoryGroupList - Shows all 18 POI categories organized in 5 groups
 * Each category is a toggleable chip with icon and name
 */
export const CategoryGroupList = memo(function CategoryGroupList({
  selectedCategories,
  onToggleCategory,
}: CategoryGroupListProps) {
  return (
    <View style={styles.container}>
      {POI_CATEGORY_GROUPS.map((group) => (
        <View key={group.id} style={styles.groupSection}>
          {/* Group header */}
          <View style={styles.groupHeader}>
            <MaterialCommunityIcons
              name={group.icon as any}
              size={20}
              color={colors.neutral[600]}
            />
            <Text style={styles.groupTitle}>{group.name}</Text>
          </View>

          {/* Category chips */}
          <View style={styles.chipsContainer}>
            {group.categories.map((category) => {
              const isSelected = selectedCategories.includes(category);

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => onToggleCategory(category)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${CATEGORY_NAMES[category]}${isSelected ? ', selected' : ''}`}
                >
                  <MaterialCommunityIcons
                    name={CATEGORY_TO_VECTOR_ICON[category] as any}
                    size={18}
                    color={isSelected ? colors.primary[600] : colors.neutral[500]}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      isSelected && styles.chipLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {CATEGORY_NAMES[category]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  groupSection: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  chipLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  chipLabelSelected: {
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[700],
  },
});

export default CategoryGroupList;
