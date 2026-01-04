import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { loadRoute, hasDevelopedVersion } from '../../routes/services/routeLoader.service';
import { ParsedRoute } from '../../routes/types';
import { logger, isNetworkError, isTimeoutError } from '../../../shared/utils';

export interface UseRouteManagementReturn {
  routes: ParsedRoute[];
  enabledRouteIds: number[];
  selectedRouteId: number | null;
  isLoading: boolean;
  error: string | null;

  // Derived data
  enabledRoutes: ParsedRoute[];
  selectedRoutes: ParsedRoute[];
  selectedFullRoute: ParsedRoute | null;
  sortedRoutes: ParsedRoute[];
  routeGeoJSON: FeatureCollection<LineString>;

  // Actions
  toggleRoute: (euroVeloId: number) => void;
  selectRoute: (euroVeloId: number | null) => void;
}

/**
 * Hook for managing EuroVelo routes - loading, enabling, selecting
 */
export function useRouteManagement(): UseRouteManagementReturn {
  const [routes, setRoutes] = useState<ParsedRoute[]>([]);
  const [enabledRouteIds, setEnabledRouteIds] = useState<number[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load routes ON DEMAND when user enables a route
  useEffect(() => {
    if (enabledRouteIds.length === 0) return;

    // Find routes that are enabled but not yet loaded
    const loadedEuroVeloIds = new Set(routes.map((r) => r.euroVeloId));
    const routesToLoad = enabledRouteIds.filter((id) => !loadedEuroVeloIds.has(id));

    if (routesToLoad.length === 0) return;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const newRoutes: ParsedRoute[] = [];

        for (const euroVeloId of routesToLoad) {
          // Load full route
          const fullRoute = await loadRoute(euroVeloId, 'full');
          if (fullRoute) {
            newRoutes.push(fullRoute);
          }

          // Load developed route if available
          if (hasDevelopedVersion(euroVeloId)) {
            const developedRoute = await loadRoute(euroVeloId, 'developed');
            if (developedRoute) {
              newRoutes.push(developedRoute);
            }
          }
        }

        // Add to existing routes (don't replace)
        setRoutes((prev) => [...prev, ...newRoutes]);
      } catch (error) {
        logger.error('ui', 'Failed to load route', error);

        let errorMessage = 'Unable to load route. Please try again.';

        if (isNetworkError(error)) {
          errorMessage = 'Unable to load route. Check your connection.';
        } else if (isTimeoutError(error)) {
          errorMessage = 'Route loading timed out. The route file may be too large.';
        }

        setError(errorMessage);
        Alert.alert('Route Loading Failed', errorMessage);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [enabledRouteIds, routes]);

  // Toggle function for enabling/disabling routes
  const toggleRoute = useCallback((euroVeloId: number) => {
    setEnabledRouteIds((prev) => {
      if (prev.includes(euroVeloId)) {
        // Disable route
        if (selectedRouteId === euroVeloId) {
          setSelectedRouteId(null); // Clear info card selection
        }
        return prev.filter((id) => id !== euroVeloId);
      } else {
        // Enable route and select it for info card
        setSelectedRouteId(euroVeloId);
        return [...prev, euroVeloId];
      }
    });
  }, [selectedRouteId]);

  // Select a route for info card display
  const selectRoute = useCallback((euroVeloId: number | null) => {
    setSelectedRouteId(euroVeloId);
  }, []);

  // Get enabled routes (routes that are toggled on)
  const enabledRoutes = useMemo(() => {
    return routes.filter((r) => enabledRouteIds.includes(r.euroVeloId));
  }, [routes, enabledRouteIds]);

  // Get routes for selected route (for info card display)
  const selectedRoutes = useMemo(() => {
    if (!selectedRouteId) return [];
    return routes.filter((r) => r.euroVeloId === selectedRouteId);
  }, [routes, selectedRouteId]);

  // Get the full route for initial region calculation and info card
  const selectedFullRoute = useMemo(() => {
    return selectedRoutes.find((r) => r.variant === 'full') || selectedRoutes[0] || null;
  }, [selectedRoutes]);

  // Sort enabled routes: full routes first (bottom layer), developed routes on top
  const sortedRoutes = useMemo(() => {
    return [...enabledRoutes].sort((a, b) => {
      if (a.variant === 'full' && b.variant === 'developed') return -1;
      if (a.variant === 'developed' && b.variant === 'full') return 1;
      return 0;
    });
  }, [enabledRoutes]);

  // Convert routes to GeoJSON for Mapbox ShapeSource
  const routeGeoJSON = useMemo((): FeatureCollection<LineString> => {
    const features: Feature<LineString>[] = sortedRoutes.flatMap((route) => {
      // Validate segments exist and is an array
      if (!Array.isArray(route.segments)) {
        logger.warn('ui', 'Route segments is not an array', { routeId: route.id });
        return [];
      }

      return route.segments
        .map((segment, segmentIndex) => {
          // Validate segment is an array with coordinates
          if (!Array.isArray(segment) || segment.length === 0) {
            logger.warn('ui', 'Invalid segment in route', { routeId: route.id, segmentIndex });
            return null;
          }

          // Validate all points have valid coordinates
          const validCoordinates = segment
            .filter((p) => {
              if (!p || typeof p.longitude !== 'number' || typeof p.latitude !== 'number') {
                return false;
              }
              return isFinite(p.longitude) && isFinite(p.latitude);
            })
            .map((p) => [p.longitude, p.latitude]);

          // Skip segment if no valid coordinates
          if (validCoordinates.length === 0) {
            logger.warn('ui', 'Segment has no valid coordinates', { routeId: route.id, segmentIndex });
            return null;
          }

          return {
            type: 'Feature' as const,
            id: `${route.id}-seg-${segmentIndex}`,
            properties: {
              routeId: route.euroVeloId,
              variant: route.variant,
              color: route.color,
              isSelected: route.euroVeloId === selectedRouteId,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: validCoordinates,
            },
          };
        })
        .filter((feature): feature is Feature<LineString> => feature !== null);
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [sortedRoutes, selectedRouteId]);

  return {
    routes,
    enabledRouteIds,
    selectedRouteId,
    isLoading,
    error,
    enabledRoutes,
    selectedRoutes,
    selectedFullRoute,
    sortedRoutes,
    routeGeoJSON,
    toggleRoute,
    selectRoute,
  };
}
