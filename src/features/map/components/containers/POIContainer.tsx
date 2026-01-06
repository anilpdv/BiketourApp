/**
 * POI Container
 * Manages POI list view, filters modal, and detail sheet
 */

import React, { useRef, useCallback, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { POIDetailSheet, POIDetailSheetRef, POI } from '../../../pois';
import { FiltersModal } from '../../../pois/components/FiltersModal';
import { POIListView, POIListHeader, SortOption } from '../../../pois/components/POIListView';
import { useFilterStore } from '../../../pois/store/filterStore';
import { usePOIStore } from '../../../pois';

interface POIContainerProps {
  isListView: boolean;
  filteredPOIs: POI[];
  pois: POI[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  location: Location.LocationObject | null;
  onSelectPOI: (poi: POI | null) => void;
  onToggleToMap: () => void;
  poiCounts: Record<string, number>;
}

export function POIContainer({
  isListView,
  filteredPOIs,
  pois,
  favoriteIds,
  isLoading,
  location,
  onSelectPOI,
  onToggleToMap,
  poiCounts,
}: POIContainerProps) {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const {
    filters: extendedFilters,
    isModalVisible: isFiltersModalVisible,
    openModal: openFiltersModal,
    closeModal: closeFiltersModal,
    applyFilters,
    getActiveFilterCount,
    getQuickFiltersWithCounts,
    toggleCategory,
  } = useFilterStore();

  // Sort POIs based on sortBy
  const sortedPOIs = useMemo(() => {
    const sorted = [...filteredPOIs];
    switch (sortBy) {
      case 'distance':
        return sorted.sort(
          (a, b) => (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity)
        );
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(a.tags?.rating || a.tags?.stars || '0');
          const ratingB = parseFloat(b.tags?.rating || b.tags?.stars || '0');
          return ratingB - ratingA;
        });
      case 'price':
        // Lower price first
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.tags?.fee?.match(/\d+/)?.[0] || '9999');
          const priceB = parseFloat(b.tags?.fee?.match(/\d+/)?.[0] || '9999');
          return priceA - priceB;
        });
      default:
        return sorted; // relevance = default order
    }
  }, [filteredPOIs, sortBy]);

  // Handle POI selection from list
  const handleSelectPOIFromList = useCallback(
    (poi: POI) => {
      onSelectPOI(poi);
      poiDetailSheetRef.current?.present(poi);
    },
    [onSelectPOI]
  );

  // Handle POI sheet close
  const handlePOISheetClose = useCallback(() => {
    onSelectPOI(null);
  }, [onSelectPOI]);

  // Handle toggle favorite from list
  const handleToggleFavorite = useCallback((poi: POI) => {
    // Toggle favorite via POI store
    const store = usePOIStore.getState();
    store.toggleFavorite(poi);
  }, []);

  // Handle refresh POIs
  const handleRefresh = useCallback(() => {
    // Refresh is handled by parent via loadPOIsForBounds
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
  }, []);

  // Handle toggle quick filter
  const handleToggleQuickFilter = useCallback(
    (filterId: string) => {
      // Handle category quick filters
      if (filterId.startsWith('category_')) {
        const category = filterId.replace('category_', '');
        toggleCategory(category as any);
      }
      // Price and rating filters open the modal
      if (filterId === 'maxPrice' || filterId === 'minRating') {
        openFiltersModal();
      }
    },
    [toggleCategory, openFiltersModal]
  );

  return (
    <>
      {/* POI List View - shown when in list mode */}
      {isListView && (
        <View style={styles.listContainer}>
          <POIListHeader
            onToggleToMap={onToggleToMap}
            onOpenFilters={openFiltersModal}
            activeFilterCount={getActiveFilterCount()}
            quickFilters={getQuickFiltersWithCounts(poiCounts)}
            onToggleQuickFilter={handleToggleQuickFilter}
          />
          <POIListView
            pois={sortedPOIs}
            userLocation={
              location
                ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }
                : null
            }
            onSelectPOI={handleSelectPOIFromList}
            onToggleFavorite={handleToggleFavorite}
            favoriteIds={favoriteIds}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </View>
      )}

      {/* Filters Modal */}
      <FiltersModal
        visible={isFiltersModalVisible}
        onClose={closeFiltersModal}
        onApply={applyFilters}
        currentFilters={extendedFilters}
        pois={pois}
      />

      {/* POI Detail Sheet */}
      <POIDetailSheet
        ref={poiDetailSheetRef}
        onClose={handlePOISheetClose}
        userLocation={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
});

// Export ref type for parent
export type { POIDetailSheetRef };
