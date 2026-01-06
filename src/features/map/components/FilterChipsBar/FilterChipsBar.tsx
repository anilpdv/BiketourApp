import React, { memo } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QuickFilterChip } from './QuickFilterChip';
import { QuickFilter } from '../../../pois/types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

interface FilterChipsBarProps {
  onOpenFilters: () => void;
  activeFilterCount: number;
  quickFilters: QuickFilter[];
  onToggleQuickFilter: (filterId: string) => void;
  containerStyle?: ViewStyle;
  useAbsolutePosition?: boolean;
}

export const FilterChipsBar = memo(function FilterChipsBar({
  onOpenFilters,
  activeFilterCount,
  quickFilters,
  onToggleQuickFilter,
  containerStyle,
  useAbsolutePosition = true,
}: FilterChipsBarProps) {
  const insets = useSafeAreaInsets();
  const topPosition = insets.top + 60; // Safe area + header height (48) + padding

  const containerStyles = useAbsolutePosition
    ? [styles.container, { top: topPosition }, containerStyle]
    : [styles.containerRelative, containerStyle];

  return (
    <View style={containerStyles}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filters button with badge */}
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={onOpenFilters}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={colors.neutral[0]}
          />
          <Text style={styles.filtersText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {activeFilterCount > 9 ? '9+' : activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick filter chips */}
        {quickFilters.map((filter) => (
          <QuickFilterChip
            key={filter.id}
            label={filter.label}
            isActive={filter.isActive}
            icon={filter.icon}
            count={filter.count}
            onPress={() => onToggleQuickFilter(filter.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
  containerRelative: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    gap: spacing.xs,
    ...shadows.md,
  },
  filtersText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
  badge: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
});

export default FilterChipsBar;
