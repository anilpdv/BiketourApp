/**
 * POI Filtering Hook
 * Handles POI filtering by viewport and category, with throttled updates
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  usePOIStore,
  selectPOIsInViewport,
  POI,
  POICategory,
  BoundingBox,
} from '../../pois';

// Throttle delay for filtered POI updates (ms)
const FILTER_UPDATE_THROTTLE = 100;

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

  // Use Zustand selectors for granular subscriptions
  const pois = usePOIStore((state) => state.pois);
  const filters = usePOIStore((state) => state.filters);

  // Calculate filtered POIs (immediate, for internal use)
  const filteredPOIs = useMemo(() => {
    if (!viewportBounds) {
      return pois.filter((poi) => filters.categories.includes(poi.category));
    }
    return selectPOIsInViewport(viewportBounds)(usePOIStore.getState());
  }, [viewportBounds, pois, filters.categories]);

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
