/**
 * POI Filtering Hook
 * Handles POI filtering by viewport and category, with throttled updates
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  usePOIStore,
  POI,
  POICategory,
  BoundingBox,
} from '../../pois';
import { useFilterStore } from '../../pois/store/filterStore';

// Throttle delay for filtered POI updates (ms)
const FILTER_UPDATE_THROTTLE = 100;

// Maximum number of markers to render to prevent Yoga layout crash
// MarkerView creates React Native Views, which can overwhelm the layout engine
const MAX_RENDERED_MARKERS = 200;

export interface UsePOIFilteringReturn {
  filteredPOIs: POI[];
  throttledFilteredPOIs: POI[];
  poiCounts: Record<POICategory, number>;
  setViewportBounds: (bounds: BoundingBox | null) => void;
}

/**
 * Hook for filtering POIs by viewport bounds and categories
 * Provides throttled updates to prevent excessive re-renders during pan
 */
export function usePOIFiltering(): UsePOIFilteringReturn {
  const [viewportBounds, setViewportBounds] = useState<BoundingBox | null>(null);
  const [throttledFilteredPOIs, setThrottledFilteredPOIs] = useState<POI[]>([]);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);
  // Track last valid POIs to show during loading (prevents flicker)
  const lastValidPOIsRef = useRef<POI[]>([]);

  // Use Zustand selectors for granular subscriptions
  const pois = usePOIStore((state) => state.pois);
  const isLoading = usePOIStore((state) => state.isLoading);
  // Read categories from filterStore (single source of truth for filters)
  const filterCategories = useFilterStore((state) => state.filters.categories);

  // Calculate filtered POIs (immediate, for internal use)
  const filteredPOIs = useMemo(() => {
    // During loading, keep showing previous POIs (prevents flicker during pan)
    // This maintains visual continuity while new POIs are fetched
    if (isLoading) {
      return lastValidPOIsRef.current;
    }

    // Filter by selected categories
    const categoryFiltered = pois.filter((poi) => {
      // If no categories selected, show all POIs (both downloaded and online)
      if (filterCategories.length === 0) {
        return true;
      }
      // If categories selected, filter by category (downloaded or not)
      return filterCategories.includes(poi.category);
    });

    // If no viewport bounds, return category-filtered POIs
    if (!viewportBounds) {
      return categoryFiltered;
    }

    // Filter by viewport bounds - ALL POIs (including downloaded) must be in viewport
    // This prevents Yoga layout crash from rendering 36,000+ MarkerView components
    const viewportFiltered = categoryFiltered.filter(
      (poi) =>
        poi.latitude >= viewportBounds.south &&
        poi.latitude <= viewportBounds.north &&
        poi.longitude >= viewportBounds.west &&
        poi.longitude <= viewportBounds.east
    );

    // Limit number of markers to prevent Yoga layout crash
    let result: POI[];
    if (viewportFiltered.length > MAX_RENDERED_MARKERS) {
      result = viewportFiltered.slice(0, MAX_RENDERED_MARKERS);
    } else {
      result = viewportFiltered;
    }

    // Store result for next loading cycle (prevents flicker)
    lastValidPOIsRef.current = result;
    return result;
  }, [viewportBounds, pois, filterCategories, isLoading]);

  // Throttle updates to prevent constant re-renders during pan
  // Skip throttle on first render with data for instant display
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
    }, FILTER_UPDATE_THROTTLE);

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

  return {
    filteredPOIs,
    throttledFilteredPOIs,
    poiCounts,
    setViewportBounds,
  };
}
