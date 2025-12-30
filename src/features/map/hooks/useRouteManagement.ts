import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { loadRoute, hasDevelopedVersion } from '../../routes/services/routeLoader.service';
import { ParsedRoute } from '../../routes/types';

export interface UseRouteManagementReturn {
  routes: ParsedRoute[];
  enabledRouteIds: number[];
  selectedRouteId: number | null;
  isLoading: boolean;

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

  // Load routes ON DEMAND when user enables a route
  useEffect(() => {
    if (enabledRouteIds.length === 0) return;

    // Find routes that are enabled but not yet loaded
    const loadedEuroVeloIds = new Set(routes.map((r) => r.euroVeloId));
    const routesToLoad = enabledRouteIds.filter((id) => !loadedEuroVeloIds.has(id));

    if (routesToLoad.length === 0) return;

    (async () => {
      setIsLoading(true);
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
        console.error('Failed to load route:', error);
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
    const features: Feature<LineString>[] = sortedRoutes.flatMap((route) =>
      route.segments.map((segment, segmentIndex) => ({
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
          coordinates: segment.map((p) => [p.longitude, p.latitude]),
        },
      }))
    );

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
    enabledRoutes,
    selectedRoutes,
    selectedFullRoute,
    sortedRoutes,
    routeGeoJSON,
    toggleRoute,
    selectRoute,
  };
}
