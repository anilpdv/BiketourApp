/**
 * Hook for managing route surface data
 * Fetches and caches surface information from OSM
 */

import { useState, useCallback, useRef } from 'react';
import type { FeatureCollection, LineString } from 'geojson';
import { ParsedRoute, RouteSurfaceData, SurfaceSegment } from '../../routes/types';
import {
  querySurfaceForRoute,
  mergeAdjacentSegments,
} from '../../routes/services/surfaceQuery.service';
import { surfaceSegmentsToGeoJSON } from '../components/SurfaceLayer';
import { logger } from '../../../shared/utils';

export interface UseSurfaceDataReturn {
  surfaceGeoJSON: FeatureCollection<LineString> | null;
  surfaceData: RouteSurfaceData | null;
  isLoading: boolean;
  showSurface: boolean;
  toggleSurface: () => void;
  loadSurfaceForRoute: (route: ParsedRoute) => Promise<void>;
  clearSurface: () => void;
}

/**
 * Hook for fetching and displaying route surface data
 */
export function useSurfaceData(): UseSurfaceDataReturn {
  const [surfaceData, setSurfaceData] = useState<RouteSurfaceData | null>(null);
  const [surfaceGeoJSON, setSurfaceGeoJSON] = useState<FeatureCollection<LineString> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSurface, setShowSurface] = useState(false);

  // Cache surface data by route ID
  const cacheRef = useRef<Map<string, RouteSurfaceData>>(new Map());

  const loadSurfaceForRoute = useCallback(async (route: ParsedRoute) => {
    const cacheKey = route.id;

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      logger.info('surface', 'Using cached surface data', { routeId: route.id });
      setSurfaceData(cached);
      setSurfaceGeoJSON(surfaceSegmentsToGeoJSON(cached.segments));
      return;
    }

    setIsLoading(true);
    logger.info('surface', 'Loading surface data for route', { routeId: route.id });

    try {
      const data = await querySurfaceForRoute(
        route.id,
        route.points,
        (loaded, total) => {
          logger.info('surface', `Surface progress: ${loaded}/${total}`);
        }
      );

      // Merge adjacent segments for cleaner rendering
      const mergedSegments = mergeAdjacentSegments(data.segments);
      const mergedData: RouteSurfaceData = {
        ...data,
        segments: mergedSegments,
      };

      // Cache the result
      cacheRef.current.set(cacheKey, mergedData);

      setSurfaceData(mergedData);
      setSurfaceGeoJSON(surfaceSegmentsToGeoJSON(mergedSegments));

      logger.info('surface', 'Surface data loaded', {
        routeId: route.id,
        segments: mergedSegments.length,
        summary: data.summary,
      });
    } catch (error) {
      logger.warn('surface', 'Failed to load surface data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSurface = useCallback(() => {
    setShowSurface((prev) => !prev);
  }, []);

  const clearSurface = useCallback(() => {
    setSurfaceData(null);
    setSurfaceGeoJSON(null);
    setShowSurface(false);
  }, []);

  return {
    surfaceGeoJSON,
    surfaceData,
    isLoading,
    showSurface,
    toggleSurface,
    loadSurfaceForRoute,
    clearSurface,
  };
}
