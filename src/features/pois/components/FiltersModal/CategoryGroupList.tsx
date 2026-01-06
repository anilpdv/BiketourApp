import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Category group colors for visual distinction
const GROUP_COLORS: Record<string, { bg: string; accent: string }> = {
  camping: { bg: '#E8F5E9', accent: '#2E7D32' },
  services: { bg: '#FFF3E0', accent: '#E65100' },
  accommodation: { bg: '#E3F2FD', accent: '#1565C0' },
  bike: { bg: '#FCE4EC', accent: '#C2185B' },
  food: { bg: '#FFEBEE', accent: '#C62828' },
  emergency: { bg: '#FBE9E7', accent: '#BF360C' },
};

/**
 * CategoryGroupList - Shows all 18 POI categories organized in 5 groups
 * Modern design with colored chips and checkmarks for selected state
 */
export const CategoryGroupList = memo(function CategoryGroupList({
  selectedCategories,
  onToggleCategory,
}: CategoryGroupListProps) {
  return (
    <View style={styles.container}>
      {POI_CATEGORY_GROUPS.map((group) => {
        const groupColor = GROUP_COLORS[group.id] || { bg: colors.neutral[100], accent: colors.neutral[600] };

        return (
          <View key={group.id} style={styles.groupSection}>
            {/* Group header */}
            <View style={styles.groupHeader}>
              <View style={[styles.groupIconContainer, { backgroundColor: groupColor.bg }]}>
                <MaterialCommunityIcons
                  name={group.icon as any}
                  size={18}
                  color={groupColor.accent}
                />
              </View>
              <Text style={[styles.groupTitle, { color: groupColor.accent }]}>{group.name}</Text>
            </View>

            {/* Category chips */}
            <View style={styles.chipsContainer}>
              {group.categories.map((category) => {
                const isSelected = selectedCategories.includes(category);

                return (
                  <Pressable
                    key={category}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: isSelected ? groupColor.accent : groupColor.bg },
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => onToggleCategory(category)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${CATEGORY_NAMES[category]}${isSelected ? ', selected' : ''}`}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#fff"
                        style={styles.checkIcon}
                      />
                    )}
                    <MaterialCommunityIcons
                      name={CATEGORY_TO_VECTOR_ICON[category] as any}
                      size={18}
                      color={isSelected ? '#fff' : groupColor.accent}
                    />
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: isSelected ? '#fff' : groupColor.accent },
                        isSelected && styles.chipLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {CATEGORY_NAMES[category]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing['2xl'],
  },
  groupSection: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.3,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 22,
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  checkIcon: {
    marginRight: -2,
  },
  chipLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  chipLabelSelected: {
    fontWeight: typography.fontWeights.semibold,
  },
});

export default CategoryGroupList;
