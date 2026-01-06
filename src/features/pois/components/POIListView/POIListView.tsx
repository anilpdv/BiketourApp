import React, { memo, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  RefreshControl,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { POIListCard } from './POIListCard';
import { SortDropdown, SortOption } from './SortDropdown';
import { POI } from '../../types';
import {
  colors,
  spacing,
  typography,
} from '../../../../shared/design/tokens';

interface POIListViewProps {
  pois: POI[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectPOI: (poi: POI) => void;
  onToggleFavorite: (poi: POI) => void;
  favoriteIds: Set<string>;
  isLoading: boolean;
  onRefresh: () => void;
  sortBy?: SortOption;
  onSortChange?: (sortBy: SortOption) => void;
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="map-marker-off"
        size={64}
        color={colors.neutral[300]}
      />
      <Text style={styles.emptyTitle}>No locations found</Text>
      <Text style={styles.emptyMessage}>
        Try adjusting your filters or search area
      </Text>
    </View>
  );
}

/**
 * List header with count and sort dropdown
 */
function ListHeader({
  count,
  sortBy,
  onSortChange,
}: {
  count: number;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.countText}>
        <Text style={styles.countNumber}>{count}</Text> locations
      </Text>
      <SortDropdown value={sortBy} onChange={onSortChange} />
    </View>
  );
}

export const POIListView = memo(function POIListView({
  pois,
  userLocation,
  onSelectPOI,
  onToggleFavorite,
  favoriteIds,
  isLoading,
  onRefresh,
  sortBy = 'relevance',
  onSortChange,
}: POIListViewProps) {
  const renderItem: ListRenderItem<POI> = useCallback(
    ({ item }) => (
      <POIListCard
        poi={item}
        distance={item.distanceFromUser}
        isFavorite={favoriteIds.has(item.id)}
        onPress={() => onSelectPOI(item)}
        onToggleFavorite={() => onToggleFavorite(item)}
      />
    ),
    [favoriteIds, onSelectPOI, onToggleFavorite]
  );

  const keyExtractor = useCallback((item: POI) => item.id, []);

  const handleSortChange = useCallback(
    (newSortBy: SortOption) => {
      onSortChange?.(newSortBy);
    },
    [onSortChange]
  );

  const ListHeaderComponent = useCallback(
    () => (
      <ListHeader
        count={pois.length}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />
    ),
    [pois.length, sortBy, handleSortChange]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pois}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={!isLoading ? EmptyState : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({
          length: 166, // card height (150) + margin (16)
          offset: 166 * index + 52, // header height
          index,
        })}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  listContent: {
    paddingBottom: spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  countText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  countNumber: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'] * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default POIListView;
