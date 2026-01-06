import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { EuroVeloRoute } from '../../routes/types';
import { useEuroVeloRoutes } from '../../routes/hooks/useEuroVeloRoutes';
import { EuroVeloRouteCard } from './EuroVeloRouteCard';
import { EuroVeloFilterBar } from './EuroVeloFilterBar';
import { colors, spacing, typography } from '../../../shared/design/tokens';

export const EuroVeloRoutesList = memo(function EuroVeloRoutesList() {
  const {
    routes,
    totalCount,
    filteredCount,
    availableCountries,
    filters,
    hasActiveFilters,
    setSearchQuery,
    toggleDifficulty,
    setDistanceRange,
    toggleCountry,
    clearFilters,
  } = useEuroVeloRoutes();

  const renderItem: ListRenderItem<EuroVeloRoute> = useCallback(
    ({ item }) => <EuroVeloRouteCard route={item} />,
    []
  );

  const keyExtractor = useCallback((item: EuroVeloRoute) => item.id, []);

  const ListHeader = useCallback(() => (
    <View>
      <Text style={styles.title}>EuroVelo Routes</Text>
      <Text style={styles.subtitle}>
        Explore {totalCount} iconic cycling routes across Europe
      </Text>
      <EuroVeloFilterBar
        filters={filters}
        totalCount={totalCount}
        filteredCount={filteredCount}
        availableCountries={availableCountries}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={setSearchQuery}
        onToggleDifficulty={toggleDifficulty}
        onSetDistanceRange={setDistanceRange}
        onToggleCountry={toggleCountry}
        onClearFilters={clearFilters}
      />
    </View>
  ), [
    totalCount,
    filters,
    filteredCount,
    availableCountries,
    hasActiveFilters,
    setSearchQuery,
    toggleDifficulty,
    setDistanceRange,
    toggleCountry,
    clearFilters,
  ]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No routes match your filters</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  ), []);

  return (
    <FlatList
      data={routes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      scrollEnabled={false}
      removeClippedSubviews
    />
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
  },
});
