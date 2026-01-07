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
import { useDownloadedRegionsStore } from '../../offline/store/downloadedRegionsStore';
import { HIDDEN_BY_DEFAULT } from '../../pois/config/poiGroupColors';

// Throttle delay for filtered POI updates (ms)
const FILTER_UPDATE_THROTTLE = 100;

// Maximum number of markers to render to prevent Yoga layout crash
// MarkerView creates React Native Views, which can overwhelm the layout engine
const MAX_RENDERED_MARKERS = 200;

/**
 * Check if two bounding boxes overlap
 * Used to detect if viewport is within a downloaded region
 */
function boundsOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.east < b.west ||
    a.west > b.east ||
    a.north < b.south ||
    a.south > b.north
  );
}

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
      // If no categories selected, show all POIs EXCEPT hidden-by-default ones
      // (food/restaurants are hidden by default for cleaner cyclist-focused UX)
      if (filterCategories.length === 0) {
        return !HIDDEN_BY_DEFAULT.includes(poi.category);
      }
      // If categories selected, filter by category
      // This allows users to explicitly enable hidden categories via filter
      return filterCategories.includes(poi.category);
    });

    // Check if viewport overlaps with a downloaded region
    // If so, use the full region bounds to show all downloaded POIs (not just viewport)
    const { downloadedRegions } = useDownloadedRegionsStore.getState();
    const overlappingRegion = viewportBounds
      ? downloadedRegions.find((region) => boundsOverlap(viewportBounds, region.bounds))
      : null;

    // Determine which bounds to use for filtering:
    // - If in a downloaded region: use the FULL region bounds (keeps POIs visible when panning)
    // - Otherwise: use viewport bounds (normal behavior)
    const filterBounds = overlappingRegion ? overlappingRegion.bounds : viewportBounds;

    // If no bounds at all, return category-filtered POIs (limited)
    if (!filterBounds) {
      const limited = categoryFiltered.slice(0, MAX_RENDERED_MARKERS);
      lastValidPOIsRef.current = limited;
      return limited;
    }

    // Filter by bounds (either region bounds or viewport bounds)
    // This prevents Yoga layout crash from rendering 36,000+ MarkerView components
    const boundsFiltered = categoryFiltered.filter(
      (poi) =>
        poi.latitude >= filterBounds.south &&
        poi.latitude <= filterBounds.north &&
        poi.longitude >= filterBounds.west &&
        poi.longitude <= filterBounds.east
    );

    // Limit number of markers to prevent Yoga layout crash
    // When in a downloaded region, sort by distance to viewport center
    // This ensures POIs nearest to the user's view are prioritized
    let result: POI[];
    if (boundsFiltered.length > MAX_RENDERED_MARKERS) {
      // Sort POIs by distance to viewport center, then take nearest 200
      // This ensures visible POIs are prioritized over distant ones
      if (viewportBounds) {
        const centerLat = (viewportBounds.south + viewportBounds.north) / 2;
        const centerLon = (viewportBounds.west + viewportBounds.east) / 2;

        // Sort by distance to viewport center (squared distance for performance)
        const sorted = [...boundsFiltered].sort((a, b) => {
          const distA = Math.pow(a.latitude - centerLat, 2) + Math.pow(a.longitude - centerLon, 2);
          const distB = Math.pow(b.latitude - centerLat, 2) + Math.pow(b.longitude - centerLon, 2);
          return distA - distB;
        });

        result = sorted.slice(0, MAX_RENDERED_MARKERS);
      } else {
        result = boundsFiltered.slice(0, MAX_RENDERED_MARKERS);
      }
    } else {
      result = boundsFiltered;
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
