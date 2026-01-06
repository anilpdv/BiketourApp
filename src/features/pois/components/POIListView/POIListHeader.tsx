import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SearchBar } from '../../../search/components/SearchBar';
import { FilterChipsBar } from '../../../map/components/FilterChipsBar';
import { QuickFilter } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

interface POIListHeaderProps {
  onToggleToMap: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  quickFilters: QuickFilter[];
  onToggleQuickFilter: (filterId: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
}

export const POIListHeader = memo(function POIListHeader({
  onToggleToMap,
  onOpenFilters,
  activeFilterCount,
  quickFilters,
  onToggleQuickFilter,
  onSearchFocus,
  onSearchBlur,
}: POIListHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {/* Search row with Map button */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <SearchBar
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            placeholder="Search places..."
          />
        </View>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={onToggleToMap}
          accessibilityLabel="Show map view"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="map-outline"
            size={20}
            color={colors.primary[600]}
          />
          <Text style={styles.mapButtonText}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips row */}
      <FilterChipsBar
        onOpenFilters={onOpenFilters}
        activeFilterCount={activeFilterCount}
        quickFilters={quickFilters}
        onToggleQuickFilter={onToggleQuickFilter}
        useAbsolutePosition={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
    paddingBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    minWidth: 80,
    gap: spacing.xs,
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: colors.primary[400],
  },
  mapButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[600],
  },
});

export default POIListHeader;
