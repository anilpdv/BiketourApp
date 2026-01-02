import { useState, useCallback, useEffect } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import * as Location from 'expo-location';
import { usePOIStore, POI, POICategory, BoundingBox } from '../../pois';
import { logger } from '../../../shared/utils';
import { ParsedRoute } from '../../routes/types';
import { MapBounds } from '../../../shared/types';
import { usePOIFiltering } from './usePOIFiltering';
import { usePOIGeoJSON, POIFeatureProperties } from './usePOIGeoJSON';
import { usePOIFetching } from './usePOIFetching';

export { MapBounds } from '../../../shared/types';

export interface UsePOIDisplayReturn {
  showPOIs: boolean;
  pois: POI[];
  filteredPOIs: POI[];
  poiCounts: Record<POICategory, number>;
  poiGeoJSON: FeatureCollection<Point, POIFeatureProperties>;
  isLoading: boolean;
  filters: { categories: POICategory[] };
  favoriteIds: Set<string>;

  // Actions
  togglePOIs: () => void;
  toggleCategory: (category: POICategory) => void;
  loadPOIsForBounds: (bounds: MapBounds) => void;
  updateViewportBounds: (bounds: MapBounds) => void;
  handlePOIPress: (poi: POI) => void;
  selectPOI: (poi: POI | null) => void;
}

/**
 * Hook for managing POI display and filtering
 * Composes usePOIFiltering, usePOIGeoJSON, and usePOIFetching hooks
 */
export function usePOIDisplay(
  location: Location.LocationObject | null,
  enabledRoutes: ParsedRoute[]
): UsePOIDisplayReturn {
  const [showPOIs, setShowPOIs] = useState(false);

  // Use Zustand selectors for granular subscriptions
  const pois = usePOIStore((state) => state.pois);
  const filters = usePOIStore((state) => state.filters);
  const isLoading = usePOIStore((state) => state.isLoading);
  const favoriteIds = usePOIStore((state) => state.favoriteIds);
  const selectPOI = usePOIStore((state) => state.selectPOI);
  const toggleCategory = usePOIStore((state) => state.toggleCategory);
  const loadFavorites = usePOIStore((state) => state.loadFavorites);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Compose filtering hook
  const {
    filteredPOIs,
    throttledFilteredPOIs,
    poiCounts,
    setViewportBounds,
  } = usePOIFiltering();

  // Compose GeoJSON hook
  const { poiGeoJSON } = usePOIGeoJSON(throttledFilteredPOIs, favoriteIds);

  // Compose fetching hook
  const { loadPOIsForBounds, lastBoundsRef } = usePOIFetching({
    showPOIs,
    categories: filters.categories,
    onBoundsUpdate: setViewportBounds,
  });

  // Toggle POI visibility
  // Auto-selects default categories when enabling POIs if none selected
  const togglePOIs = useCallback(() => {
    logger.info('poi', '=== TOGGLE POIs PRESSED ===');
    setShowPOIs((prev) => {
      const newValue = !prev;
      logger.info('poi', 'togglePOIs state change', {
        oldValue: prev,
        newValue,
        categoriesCount: filters.categories.length,
        hasBounds: !!lastBoundsRef.current,
      });
      // Auto-select useful categories when enabling POIs
      if (newValue && filters.categories.length === 0) {
        logger.info('poi', 'Auto-selecting campsite category');
        const defaultCategories: POICategory[] = ['campsite'];
        defaultCategories.forEach((cat) => toggleCategory(cat));
      }
      return newValue;
    });
  }, [filters.categories.length, toggleCategory, lastBoundsRef]);

  // Update viewport bounds for filtering (called on camera changes)
  const updateViewportBounds = useCallback(
    (bounds: MapBounds) => {
      // Store bounds for auto-loading when POIs enabled
      lastBoundsRef.current = bounds;

      const bbox: BoundingBox = {
        south: bounds.sw[1],
        north: bounds.ne[1],
        west: bounds.sw[0],
        east: bounds.ne[0],
      };
      setViewportBounds(bbox);
    },
    [lastBoundsRef, setViewportBounds]
  );

  // Handle POI press
  const handlePOIPress = useCallback(
    (poi: POI) => {
      selectPOI(poi);
    },
    [selectPOI]
  );

  return {
    showPOIs,
    pois,
    filteredPOIs,
    poiCounts,
    poiGeoJSON,
    isLoading,
    filters,
    favoriteIds,
    togglePOIs,
    toggleCategory,
    loadPOIsForBounds,
    updateViewportBounds,
    handlePOIPress,
    selectPOI,
  };
}
