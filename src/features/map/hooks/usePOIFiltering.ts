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
import { logger } from '../../../shared/utils';

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

  // Use Zustand selectors for granular subscriptions
  const pois = usePOIStore((state) => state.pois);
  // Read categories from filterStore (single source of truth for filters)
  const filterCategories = useFilterStore((state) => state.filters.categories);

  // Calculate filtered POIs (immediate, for internal use)
  // IMPORTANT: Downloaded POIs bypass category filters - they are always visible
  const filteredPOIs = useMemo(() => {
    logger.info('poi', '[DIAGNOSTIC] Filtering POIs', {
      totalPOIs: pois.length,
      downloadedPOIs: pois.filter(p => p.isDownloaded).length,
      filterCategories: filterCategories.length,
      hasViewportBounds: !!viewportBounds,
    });

    // Filter by selected categories
    const categoryFiltered = pois.filter((poi) => {
      // If no categories selected, show all downloaded POIs
      if (filterCategories.length === 0) {
        return poi.isDownloaded;
      }
      // If categories selected, filter by category (downloaded or not)
      return filterCategories.includes(poi.category);
    });

    logger.info('poi', '[DIAGNOSTIC] After category filter', {
      categoryFiltered: categoryFiltered.length,
      downloadedInFiltered: categoryFiltered.filter(p => p.isDownloaded).length,
    });

    // If no viewport bounds, return category-filtered POIs
    if (!viewportBounds) {
      logger.info('poi', '[DIAGNOSTIC] Final filtered POIs (no viewport)', {
        count: categoryFiltered.length,
        downloadedInFinal: categoryFiltered.filter(p => p.isDownloaded).length,
      });
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

    logger.info('poi', '[DIAGNOSTIC] Final filtered POIs (with viewport)', {
      count: viewportFiltered.length,
      downloadedInFinal: viewportFiltered.filter(p => p.isDownloaded).length,
      viewportBounds,
    });

    // Limit number of markers to prevent Yoga layout crash
    // MarkerView creates React Native Views which can overwhelm the layout engine
    if (viewportFiltered.length > MAX_RENDERED_MARKERS) {
      logger.warn('poi', `Limiting markers from ${viewportFiltered.length} to ${MAX_RENDERED_MARKERS}`);
      return viewportFiltered.slice(0, MAX_RENDERED_MARKERS);
    }

    return viewportFiltered;
  }, [viewportBounds, pois, filterCategories]);

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
