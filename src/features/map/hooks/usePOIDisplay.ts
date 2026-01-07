import { useCallback, useEffect, useMemo } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import * as Location from 'expo-location';
import { usePOIStore, POI, POICategory, BoundingBox } from '../../pois';
import { useFilterStore } from '../../pois/store/filterStore';
import { ParsedRoute } from '../../routes/types';
import { MapBounds } from '../../../shared/types';
import { debounce } from '../../../shared/utils';
import { usePOIFiltering } from './usePOIFiltering';
import { usePOIGeoJSON, POIFeatureProperties } from './usePOIGeoJSON';
import { usePOIFetching } from './usePOIFetching';
import { usePOISelection } from './usePOISelection';

// Debounce delay for viewport bounds updates during pan (ms)
const VIEWPORT_UPDATE_DEBOUNCE = 150;

export { MapBounds } from '../../../shared/types';

export interface UsePOIDisplayReturn {
  pois: POI[];
  filteredPOIs: POI[];
  poiCounts: Record<POICategory, number>;
  poiGeoJSON: FeatureCollection<Point, POIFeatureProperties>;
  isLoading: boolean;
  filters: { categories: POICategory[] };
  favoriteIds: Set<string>;

  // Actions
  toggleCategory: (category: POICategory) => void;
  loadPOIsForBounds: (bounds: MapBounds) => void;
  updateViewportBounds: (bounds: MapBounds) => void;
  handlePOIPress: (poi: POI) => void;
  selectPOI: (poi: POI | null) => void;
}

/**
 * Hook for managing POI display and filtering
 * Simplified: POIs are always visible (no toggle)
 * Loads only downloaded POIs from local database
 */
export function usePOIDisplay(
  _location: Location.LocationObject | null,
  _enabledRoutes: ParsedRoute[]
): UsePOIDisplayReturn {
  // Selection hook
  const { selectPOI, handlePOIPress } = usePOISelection();

  // Use Zustand selectors for granular subscriptions
  const pois = usePOIStore((state) => state.pois);
  const isLoading = usePOIStore((state) => state.isLoading);
  const favoriteIds = usePOIStore((state) => state.favoriteIds);
  const loadFavorites = usePOIStore((state) => state.loadFavorites);

  // Use filterStore for filter state (single source of truth)
  const filterCategories = useFilterStore((state) => state.filters.categories);
  const toggleCategory = useFilterStore((state) => state.toggleCategory);

  // Create compatible filters object for return value
  const filters = { categories: filterCategories };

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

  // Compose fetching hook (simplified - no options needed)
  const { loadPOIsForBounds, lastBoundsRef } = usePOIFetching();

  // Debounced viewport bounds setter to reduce filtering frequency during pan
  const debouncedSetViewportBounds = useMemo(
    () => debounce((bbox: BoundingBox) => setViewportBounds(bbox), VIEWPORT_UPDATE_DEBOUNCE),
    [setViewportBounds]
  );

  // Update viewport bounds for filtering (called on camera changes)
  const updateViewportBounds = useCallback(
    (bounds: MapBounds) => {
      // Store bounds immediately for reference
      lastBoundsRef.current = bounds;

      // Debounce the viewport bounds update to reduce filtering frequency
      const bbox: BoundingBox = {
        south: bounds.sw[1],
        north: bounds.ne[1],
        west: bounds.sw[0],
        east: bounds.ne[0],
      };
      debouncedSetViewportBounds(bbox);
    },
    [lastBoundsRef, debouncedSetViewportBounds]
  );

  return {
    pois,
    filteredPOIs,
    poiCounts,
    poiGeoJSON,
    isLoading,
    filters,
    favoriteIds,
    toggleCategory,
    loadPOIsForBounds,
    updateViewportBounds,
    handlePOIPress,
    selectPOI,
  };
}
