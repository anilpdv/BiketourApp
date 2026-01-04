/**
 * POI Container
 * Manages POI list view, filters modal, and detail sheet
 */

import React, { useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { POIDetailSheet, POIDetailSheetRef, POI } from '../../../pois';
import { FiltersModal } from '../../../pois/components/FiltersModal';
import { POIListView } from '../../../pois/components/POIListView';
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
}

export function POIContainer({
  isListView,
  filteredPOIs,
  pois,
  favoriteIds,
  isLoading,
  location,
  onSelectPOI,
}: POIContainerProps) {
  const poiDetailSheetRef = useRef<POIDetailSheetRef>(null);

  const {
    filters: extendedFilters,
    isModalVisible: isFiltersModalVisible,
    closeModal: closeFiltersModal,
    applyFilters,
  } = useFilterStore();

  // Handle POI selection from list
  const handleSelectPOIFromList = useCallback((poi: POI) => {
    onSelectPOI(poi);
    poiDetailSheetRef.current?.present(poi);
  }, [onSelectPOI]);

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

  return (
    <>
      {/* POI List View - shown when in list mode */}
      {isListView && (
        <POIListView
          pois={filteredPOIs}
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
        />
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

// Export ref type for parent
export type { POIDetailSheetRef };
