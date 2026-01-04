/**
 * POI Fetching Hook
 * Handles POI loading with abort controller and progressive display
 */

import { useCallback, useRef } from 'react';
import {
  usePOIStore,
  fetchPOIsForViewport,
  POICategory,
  BoundingBox,
} from '../../pois';
import { logger, isAbortError } from '../../../shared/utils';
import { MapBounds } from '../../../shared/types';

export interface UsePOIFetchingOptions {
  showPOIs: boolean;
  categories: POICategory[];
  onBoundsUpdate?: (bounds: BoundingBox) => void;
}

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
 * Hook for fetching POIs with abort controller support
 * Prevents abort storm during rapid panning
 */
export function usePOIFetching(options: UsePOIFetchingOptions): UsePOIFetchingReturn {
  const { showPOIs, categories, onBoundsUpdate } = options;

  // Store actions - use setPOIs for game-style loading (replace, not accumulate)
  const setPOIs = usePOIStore((state) => state.setPOIs);
  const setPOIsLoading = usePOIStore((state) => state.setLoading);

  // AbortController for cancelling pending POI requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track if fetch is in progress to prevent abort storm during pan
  const isFetchingRef = useRef(false);

  // Store last bounds for auto-loading when POIs enabled
  const lastBoundsRef = useRef<MapBounds | null>(null);

  // Load POIs for viewport bounds
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      const startTime = Date.now();
      logger.info('poi', 'loadPOIsForBounds START', {
        bounds,
        showPOIs,
        categories,
        isFetching: isFetchingRef.current,
      });

      // Downloaded POIs should always be loaded, regardless of showPOIs
      // The showPOIs flag only controls whether API POIs are fetched
      logger.info('poi', 'Loading POIs for bounds', {
        categories: categories.length,
        showPOIs,
        alwaysIncludeDownloaded: true,
      });

      // Don't start new fetch if one is already in progress
      if (isFetchingRef.current) {
        logger.info('poi', 'Skipping - fetch already in progress');
        lastBoundsRef.current = bounds;
        return;
      }

      isFetchingRef.current = true;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const bbox = mapBoundsToBBox(bounds);

      // Update viewport bounds for culling
      onBoundsUpdate?.(bbox);

      // Fetch POIs for viewport
      setPOIsLoading(true);
      logger.info('poi', 'Calling fetchPOIsForViewport...', { bbox });

      try {
        if (signal.aborted) {
          logger.warn('poi', 'Aborted before fetch');
          return;
        }

        // Game-style loading: fetch POIs for current viewport only
        // Pass showPOIs to control whether API POIs are fetched
        // Downloaded POIs are ALWAYS fetched regardless of showPOIs
        const viewportPOIs = await fetchPOIsForViewport(
          bbox,
          categories,
          showPOIs, // Controls whether to fetch API POIs
          undefined, // onProgress
          undefined  // No chunk callback - we replace all at once
        );

        logger.info('poi', 'fetchPOIsForViewport returned', {
          count: viewportPOIs.length,
          elapsed: Date.now() - startTime,
        });

        if (signal.aborted) {
          logger.warn('poi', 'Aborted after fetch (newer request took over)');
          return;
        }

        // Game-style loading: REPLACE all POIs with just current viewport's POIs
        // This prevents memory accumulation - only current viewport POIs in memory
        setPOIs(viewportPOIs);
        logger.info('poi', 'POIs replaced with viewport POIs (game-style)', {
          total: viewportPOIs.length,
          downloadedCount: viewportPOIs.filter(p => p.isDownloaded).length,
          totalElapsed: Date.now() - startTime,
        });
      } catch (error: unknown) {
        if (!isAbortError(error)) {
          logger.error('poi', 'Failed to load POIs for viewport', error);
        } else {
          logger.info('poi', 'Request aborted (expected)');
        }
      } finally {
        isFetchingRef.current = false;
        if (!signal.aborted) {
          setPOIsLoading(false);
          logger.info('poi', 'loadPOIsForBounds COMPLETE', {
            totalTime: Date.now() - startTime,
          });
        }
      }
    },
    [showPOIs, categories, setPOIs, setPOIsLoading, onBoundsUpdate]
  );

  // Note: Auto-trigger removed - caller controls when to fetch
  // This prevents implicit state changes and race conditions

  return {
    loadPOIsForBounds,
    lastBoundsRef,
  };
}
