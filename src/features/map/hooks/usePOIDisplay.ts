import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import * as Location from 'expo-location';
import {
  usePOIStore,
  selectPOIsInViewport,
  fetchPOIsForViewport,
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

// Throttle delay for GeoJSON updates (ms)
const GEOJSON_UPDATE_THROTTLE = 100;

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
  updateViewportBounds: (bounds: MapBounds) => void;
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

  // Use Zustand selectors for granular subscriptions (prevents unnecessary re-renders)
  const pois = usePOIStore((state) => state.pois);
  const filters = usePOIStore((state) => state.filters);
  const isLoading = usePOIStore((state) => state.isLoading);
  const favoriteIds = usePOIStore((state) => state.favoriteIds);
  const addPOIs = usePOIStore((state) => state.addPOIs);
  const selectPOI = usePOIStore((state) => state.selectPOI);
  const toggleCategory = usePOIStore((state) => state.toggleCategory);
  const setPOIsLoading = usePOIStore((state) => state.setLoading);
  const loadFavorites = usePOIStore((state) => state.loadFavorites);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // THROTTLED: Filtered POIs state to prevent constant recalculation
  const [throttledFilteredPOIs, setThrottledFilteredPOIs] = useState<POI[]>([]);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  // AbortController for cancelling pending POI requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track if fetch is in progress to prevent abort storm during pan
  const isFetchingRef = useRef(false);

  // Store last bounds for auto-loading when POIs enabled
  const lastBoundsRef = useRef<MapBounds | null>(null);

  // Calculate filtered POIs (immediate, for internal use)
  const filteredPOIs = useMemo(() => {
    if (!viewportBounds) {
      return pois.filter((poi) => filters.categories.includes(poi.category));
    }
    return selectPOIsInViewport(viewportBounds)(usePOIStore.getState());
  }, [viewportBounds, pois, filters.categories]);

  // Throttle updates to GeoJSON to prevent constant re-renders during pan
  // OPTIMIZATION: Skip throttle on first render with data for instant display
  useEffect(() => {
    // Show POIs immediately on first render with data (no delay)
    if (isFirstRenderRef.current && filteredPOIs.length > 0) {
      isFirstRenderRef.current = false;
      setThrottledFilteredPOIs(filteredPOIs);
      return;
    }

    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }
    throttleRef.current = setTimeout(() => {
      setThrottledFilteredPOIs(filteredPOIs);
    }, GEOJSON_UPDATE_THROTTLE);

    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [filteredPOIs]);

  // Calculate POI counts by category
  const poiCounts = useMemo(() => {
    const counts: Record<POICategory, number> = {} as Record<POICategory, number>;
    for (const poi of pois) {
      counts[poi.category] = (counts[poi.category] || 0) + 1;
    }
    return counts;
  }, [pois]);

  // Feature cache ref - persists across renders to avoid recreating unchanged POI features
  const featureCacheRef = useRef(new Map<string, Feature<Point>>());

  // Create a single POI feature (memoized helper)
  const createPOIFeature = useCallback((poi: POI, isFavorite: boolean): Feature<Point> => ({
    type: 'Feature' as const,
    id: poi.id,
    properties: {
      id: poi.id,
      name: poi.name || '',
      category: poi.category,
      color: CATEGORY_COLORS[poi.category] || '#666',
      makiIcon: CATEGORY_TO_MAKI_ICON[poi.category] || 'marker',
      emoji: CATEGORY_TO_EMOJI[poi.category] || '📍',
      isFavorite,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [poi.longitude, poi.latitude],
    },
  }), []);

  // Convert POIs to GeoJSON for clustering (OPTIMIZED with feature caching)
  // Only creates new features for POIs that changed or are new
  const poiGeoJSON = useMemo((): FeatureCollection<Point> => {
    const cache = featureCacheRef.current;
    const features: Feature<Point>[] = [];

    for (const poi of throttledFilteredPOIs) {
      const isFavorite = favoriteIds.has(poi.id);
      const cacheKey = `${poi.id}-${isFavorite}`;

      let feature = cache.get(cacheKey);
      if (!feature) {
        feature = createPOIFeature(poi, isFavorite);
        cache.set(cacheKey, feature);
      }
      features.push(feature);
    }

    return { type: 'FeatureCollection', features };
  }, [throttledFilteredPOIs, favoriteIds, createPOIFeature]);

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
        // Only select campsite by default
        const defaultCategories: POICategory[] = ['campsite'];
        defaultCategories.forEach((cat) => toggleCategory(cat));
      }
      return newValue;
    });
  }, [filters.categories.length, toggleCategory]);

  // Update viewport bounds for filtering (called on camera changes)
  const updateViewportBounds = useCallback((bounds: MapBounds) => {
    // Store bounds for auto-loading when POIs enabled
    lastBoundsRef.current = bounds;

    const bbox: BoundingBox = {
      south: bounds.sw[1],
      north: bounds.ne[1],
      west: bounds.sw[0],
      east: bounds.ne[0],
    };
    setViewportBounds(bbox);
  }, []);

  // Load POIs for viewport bounds (exploration mode)
  // Only fetches selected categories
  // Uses isFetchingRef to prevent abort storm during rapid panning
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      const startTime = Date.now();
      logger.info('poi', 'loadPOIsForBounds START', {
        bounds,
        showPOIs,
        categories: filters.categories,
        isFetching: isFetchingRef.current,
      });

      if (!showPOIs) {
        logger.warn('poi', 'BLOCKED: showPOIs is false');
        return;
      }
      // Don't load if no categories selected
      if (filters.categories.length === 0) {
        logger.warn('poi', 'BLOCKED: no categories selected');
        return;
      }

      // OPTIMIZATION: Don't start new fetch if one is already in progress
      // This prevents "abort storm" during rapid panning
      if (isFetchingRef.current) {
        logger.info('poi', 'Skipping - fetch already in progress');
        // Store bounds for later - will be picked up when current fetch completes
        lastBoundsRef.current = bounds;
        return;
      }

      isFetchingRef.current = true;

      // Cancel any pending request (shouldn't happen with isFetching guard, but safety)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

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
      logger.info('poi', 'Calling fetchPOIsForViewport...', { bbox });

      try {
        // Check if aborted before starting fetch
        if (signal.aborted) {
          logger.warn('poi', 'Aborted before fetch');
          return;
        }

        // PROGRESSIVE DISPLAY: Show POIs as each chunk completes
        const viewportPOIs = await fetchPOIsForViewport(
          bbox,
          filters.categories,
          undefined,  // onProgress
          (chunkPOIs) => {
            // Add POIs to store immediately as chunks complete
            if (!signal.aborted) {
              addPOIs(chunkPOIs);
              logger.info('poi', 'Chunk POIs added to store', { count: chunkPOIs.length });
            }
          }
        );

        logger.info('poi', 'fetchPOIsForViewport returned', {
          count: viewportPOIs.length,
          elapsed: Date.now() - startTime,
        });

        // Check if aborted after fetch (new request may have started)
        if (signal.aborted) {
          logger.warn('poi', 'Aborted after fetch (newer request took over)');
          return;
        }

        // Final add for any remaining POIs not already added via callback
        // (This is a no-op if all POIs were already added progressively)
        addPOIs(viewportPOIs);
        logger.info('poi', 'All POIs added to store', {
          totalElapsed: Date.now() - startTime,
        });
      } catch (error: any) {
        // Ignore abort errors - they're expected
        if (error?.name !== 'AbortError') {
          logger.error('poi', 'Failed to load POIs for viewport', error);
        } else {
          logger.info('poi', 'Request aborted (expected)');
        }
      } finally {
        isFetchingRef.current = false;
        // Only clear loading if this request wasn't aborted
        if (!signal.aborted) {
          setPOIsLoading(false);
          logger.info('poi', 'loadPOIsForBounds COMPLETE', {
            totalTime: Date.now() - startTime,
          });
        }
      }
    },
    [showPOIs, filters.categories, addPOIs, setPOIsLoading]
  );

  // FIX: Auto-trigger POI load when POIs enabled or categories change
  // This ensures POIs load immediately when user toggles them on,
  // not just on camera movement
  useEffect(() => {
    logger.info('poi', 'Auto-trigger effect fired', {
      showPOIs,
      categoriesCount: filters.categories.length,
      categories: filters.categories,
      hasBounds: !!lastBoundsRef.current,
      bounds: lastBoundsRef.current,
    });

    if (showPOIs && filters.categories.length > 0 && lastBoundsRef.current) {
      logger.info('poi', '>>> Calling loadPOIsForBounds from auto-trigger');
      loadPOIsForBounds(lastBoundsRef.current);
    } else {
      logger.warn('poi', 'Auto-trigger BLOCKED', {
        showPOIs,
        categoriesLength: filters.categories.length,
        hasBounds: !!lastBoundsRef.current,
      });
    }
  }, [showPOIs, filters.categories, loadPOIsForBounds]);

  // Handle POI press
  const handlePOIPress = useCallback(
    (poi: POI) => {
      selectPOI(poi);
    },
    [selectPOI]
  );

  // POIs are loaded via loadPOIsForBounds when user zooms in (viewport-based loading)
  // This is simpler and only loads POIs for the visible area

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
