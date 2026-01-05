import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { usePOIVisibility } from './usePOIVisibility';
import { usePOISelection } from './usePOISelection';

// Debounce delay for viewport bounds updates during pan (ms)
const VIEWPORT_UPDATE_DEBOUNCE = 150;

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
 * Composes focused hooks for visibility, selection, filtering, GeoJSON, and fetching
 */
export function usePOIDisplay(
  location: Location.LocationObject | null,
  enabledRoutes: ParsedRoute[]
): UsePOIDisplayReturn {
  // Focused hooks for specific concerns
  const { showPOIs, togglePOIs } = usePOIVisibility();
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

  // Compose fetching hook
  const { loadPOIsForBounds, lastBoundsRef } = usePOIFetching({
    showPOIs,
    categories: filterCategories,
    onBoundsUpdate: setViewportBounds,
  });

  // Debounced viewport bounds setter to reduce filtering frequency during pan
  const debouncedSetViewportBounds = useMemo(
    () => debounce((bbox: BoundingBox) => setViewportBounds(bbox), VIEWPORT_UPDATE_DEBOUNCE),
    [setViewportBounds]
  );

  // Update viewport bounds for filtering (called on camera changes)
  const updateViewportBounds = useCallback(
    (bounds: MapBounds) => {
      // Store bounds immediately for auto-loading when POIs enabled
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
