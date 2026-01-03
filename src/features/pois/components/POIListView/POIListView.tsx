import React, { memo, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  RefreshControl,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { POIListCard } from './POIListCard';
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
 * List header with count
 */
function ListHeader({ count }: { count: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.countText}>
        <Text style={styles.countNumber}>{count}</Text> locations
      </Text>
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

  const ListHeaderComponent = useCallback(
    () => <ListHeader count={pois.length} />,
    [pois.length]
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
          length: 156, // card height + margin
          offset: 156 * index + 60, // header height
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
    marginTop: 150, // Below header and filter chips
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
    color: colors.secondary[600],
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
