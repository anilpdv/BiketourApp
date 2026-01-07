/**
 * POI Fetching Hook
 * Simplified: Loads only downloaded POIs from local database
 * No real-time API fetching - offline-first approach
 */

import { useCallback, useRef } from 'react';
import { usePOIStore, BoundingBox } from '../../pois';
import { poiRepositoryWM as poiRepository } from '../../pois/services/poi.repository.watermelon';
import { logger } from '../../../shared/utils';
import { MapBounds } from '../../../shared/types';

export interface UsePOIFetchingReturn {
  loadPOIsForBounds: (bounds: MapBounds) => Promise<void>;
  lastBoundsRef: React.RefObject<MapBounds | null>;
}

/**
 * Converts MapBounds to BoundingBox
 */
function mapBoundsToBBox(bounds: MapBounds): BoundingBox {
  return {
    south: bounds.sw[1],
    north: bounds.ne[1],
    west: bounds.sw[0],
    east: bounds.ne[0],
  };
}

/**
 * Hook for loading downloaded POIs from local database
 * Simple and fast - no API calls, no caching logic
 */
export function usePOIFetching(): UsePOIFetchingReturn {
  const setPOIs = usePOIStore((state) => state.setPOIs);
  const setPOIsLoading = usePOIStore((state) => state.setLoading);

  // Store last bounds for reference
  const lastBoundsRef = useRef<MapBounds | null>(null);

  // Track if fetch is in progress to prevent concurrent loads
  const isFetchingRef = useRef(false);

  // Load downloaded POIs for viewport bounds
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      // Store bounds for reference
      lastBoundsRef.current = bounds;

      // Don't start new fetch if one is already in progress
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setPOIsLoading(true);

      const startTime = Date.now();
      const bbox = mapBoundsToBBox(bounds);

      try {
        // Simple database query - only downloaded POIs
        const downloadedPOIs = await poiRepository.getDownloadedPOIsInBounds(bbox);

        setPOIs(downloadedPOIs);

        logger.info('poi', 'Loaded downloaded POIs', {
          count: downloadedPOIs.length,
          elapsed: Date.now() - startTime,
        });
      } catch (error) {
        logger.error('poi', 'Failed to load downloaded POIs', error);
      } finally {
        isFetchingRef.current = false;
        setPOIsLoading(false);
      }
    },
    [setPOIs, setPOIsLoading]
  );

  return {
    loadPOIsForBounds,
    lastBoundsRef,
  };
}
