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
 * Check if two bounding boxes are similar (within threshold)
 * This prevents redundant database queries when the viewport barely moved
 */
function boundsAreSimilar(a: BoundingBox, b: BoundingBox, threshold = 0.005): boolean {
  return (
    Math.abs(a.south - b.south) < threshold &&
    Math.abs(a.north - b.north) < threshold &&
    Math.abs(a.west - b.west) < threshold &&
    Math.abs(a.east - b.east) < threshold
  );
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

  // Track last LOADED bounds to avoid redundant database queries
  const lastLoadedBboxRef = useRef<BoundingBox | null>(null);

  // Track if fetch is in progress to prevent concurrent loads
  const isFetchingRef = useRef(false);

  // Load downloaded POIs for viewport bounds
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      // Store bounds for reference
      lastBoundsRef.current = bounds;

      const bbox = mapBoundsToBBox(bounds);

      // Skip if bounds are similar to last loaded bounds (prevents redundant loads)
      if (lastLoadedBboxRef.current && boundsAreSimilar(lastLoadedBboxRef.current, bbox)) {
        return;
      }

      // Check download protection - skip fetch during grace period after download
      // This prevents wiping recently downloaded POIs during fly-to animation
      const { downloadProtection } = usePOIStore.getState();
      const now = Date.now();
      if (downloadProtection.isActive && now < downloadProtection.expiresAt) {
        logger.info('poi', 'Skipping fetch during download protection', {
          remainingMs: downloadProtection.expiresAt - now,
        });
        return;
      }

      // Don't start new fetch if one is already in progress
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setPOIsLoading(true);

      const startTime = Date.now();

      try {
        // Simple database query - only downloaded POIs
        const downloadedPOIs = await poiRepository.getDownloadedPOIsInBounds(bbox);

        // Update last loaded bounds AFTER successful load
        lastLoadedBboxRef.current = bbox;

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
