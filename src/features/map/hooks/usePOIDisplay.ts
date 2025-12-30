import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import * as Location from 'expo-location';
import {
  usePOIStore,
  selectPOIsInViewport,
  fetchPOIsForRouteProgressively,
  fetchPOIsForViewport,
  addDistanceFromUser,
  POI,
  POICategory,
  BoundingBox,
} from '../../pois';
import {
  CATEGORY_COLORS,
  CATEGORY_TO_MAKI_ICON,
  CATEGORY_TO_EMOJI,
} from '../../pois/config/poiIcons';
import { logger } from '../../../shared/utils';
import { ParsedRoute } from '../../routes/types';

export interface MapBounds {
  ne: [number, number];
  sw: [number, number];
}

export interface UsePOIDisplayReturn {
  showPOIs: boolean;
  pois: POI[];
  filteredPOIs: POI[];
  poiCounts: Record<POICategory, number>;
  poiGeoJSON: FeatureCollection<Point>;
  isLoading: boolean;
  filters: { categories: POICategory[] };
  favoriteIds: Set<string>;

  // Actions
  togglePOIs: () => void;
  toggleCategory: (category: POICategory) => void;
  loadPOIsForBounds: (bounds: MapBounds) => void;
  handlePOIPress: (poi: POI) => void;
  selectPOI: (poi: POI | null) => void;
}

/**
 * Hook for managing POI display and filtering
 */
export function usePOIDisplay(
  location: Location.LocationObject | null,
  enabledRoutes: ParsedRoute[]
): UsePOIDisplayReturn {
  const [showPOIs, setShowPOIs] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<BoundingBox | null>(null);

  const {
    pois,
    filters,
    selectedPOI,
    isLoading,
    favoriteIds,
    addPOIs,
    selectPOI,
    toggleCategory,
    setLoading: setPOIsLoading,
    loadFavorites,
  } = usePOIStore();

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Memoize filtered POIs with viewport culling
  // Only includes POIs that are visible in the current viewport
  const filteredPOIs = useMemo(() => {
    if (!viewportBounds) {
      // Fallback to simple filtering if no viewport bounds
      return pois.filter((poi) => filters.categories.includes(poi.category));
    }
    // Use viewport culling - only render POIs visible on screen
    return selectPOIsInViewport(viewportBounds)(usePOIStore.getState());
  }, [viewportBounds, pois, filters.categories]);

  // Calculate POI counts by category
  const poiCounts = useMemo(() => {
    const counts: Record<POICategory, number> = {} as Record<POICategory, number>;
    for (const poi of pois) {
      counts[poi.category] = (counts[poi.category] || 0) + 1;
    }
    return counts;
  }, [pois]);

  // Convert POIs to GeoJSON for clustering
  const poiGeoJSON = useMemo((): FeatureCollection<Point> => {
    const features: Feature<Point>[] = filteredPOIs.map((poi) => ({
      type: 'Feature' as const,
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name || '',
        category: poi.category,
        color: CATEGORY_COLORS[poi.category] || '#666',
        makiIcon: CATEGORY_TO_MAKI_ICON[poi.category] || 'marker',
        emoji: CATEGORY_TO_EMOJI[poi.category] || '📍',
        isFavorite: favoriteIds.has(poi.id),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [poi.longitude, poi.latitude],
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [filteredPOIs, favoriteIds]);

  // Toggle POI visibility
  const togglePOIs = useCallback(() => {
    setShowPOIs((prev) => !prev);
  }, []);

  // Load POIs for viewport bounds (exploration mode)
  // Only fetches selected categories
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      if (!showPOIs) return;
      // Don't load if no categories selected
      if (filters.categories.length === 0) return;

      const bbox: BoundingBox = {
        south: bounds.sw[1],
        north: bounds.ne[1],
        west: bounds.sw[0],
        east: bounds.ne[0],
      };

      // Update viewport bounds for culling - only render visible POIs
      setViewportBounds(bbox);

      // Fetch POIs for viewport with selected categories only
      setPOIsLoading(true);
      try {
        const viewportPOIs = await fetchPOIsForViewport(bbox, filters.categories);
        addPOIs(viewportPOIs);
      } catch (error) {
        logger.error('ui', 'Failed to load POIs for viewport', error);
      } finally {
        setPOIsLoading(false);
      }
    },
    [showPOIs, filters.categories, addPOIs, setPOIsLoading]
  );

  // Handle POI press
  const handlePOIPress = useCallback(
    (poi: POI) => {
      selectPOI(poi);
    },
    [selectPOI]
  );

  // Load POIs along enabled routes progressively
  // Shows cached POIs immediately, then fetches fresh data segment by segment
  useEffect(() => {
    if (!showPOIs || enabledRoutes.length === 0) return;
    // Don't load if no categories selected
    if (filters.categories.length === 0) return;

    let cancelled = false;

    const loadPOIs = async () => {
      setPOIsLoading(true);

      try {
        for (const route of enabledRoutes) {
          if (cancelled) break;

          // Progressive loading: POIs appear as each segment loads
          await fetchPOIsForRouteProgressively(
            route.points,
            10, // 10km corridor
            filters.categories,
            (pois, segmentIndex) => {
              if (cancelled) return;

              // Add distance from user if location available
              let processedPOIs = pois;
              if (location) {
                processedPOIs = addDistanceFromUser(
                  pois,
                  location.coords.latitude,
                  location.coords.longitude
                );
              }

              addPOIs(processedPOIs);
            },
            (loaded, total) => {
              // Progress callback - could update UI progress indicator
              logger.debug('ui', `POI loading progress: ${loaded}/${total} segments`);
            }
          );
        }
      } catch (error: any) {
        // Don't log abort errors - they're expected when request is cancelled
        if (error?.name !== 'AbortError') {
          logger.error('ui', 'Failed to fetch POIs along route', error);
        }
      } finally {
        if (!cancelled) {
          setPOIsLoading(false);
        }
      }
    };

    loadPOIs();

    // Cleanup: mark as cancelled to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [enabledRoutes.length, showPOIs, filters.categories, location, addPOIs, setPOIsLoading]);

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
    handlePOIPress,
    selectPOI,
  };
}
