/**
 * Route Geometry Hook
 * Generates GeoJSON features for route and waypoint display on the map
 */

import { useMemo } from 'react';
import { Coordinate, Waypoint, CustomRoute } from '../../routing/types';
import { calculatePathDistance } from '../../routing/services/routing.service';

export interface UseRouteGeometryReturn {
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null;
  waypointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point>;
  routeDistance: number;
  routeDuration: number | null;
}

// Waypoint colors by type
const WAYPOINT_COLORS = {
  start: '#22C55E', // green
  end: '#EF4444', // red
  via: '#3B82F6', // blue
} as const;

/**
 * Hook for generating route and waypoint GeoJSON for map display
 */
export function useRouteGeometry(
  calculatedGeometry: Coordinate[],
  waypoints: Waypoint[],
  currentRoute: Partial<CustomRoute> | null
): UseRouteGeometryReturn {
  // Generate GeoJSON for route display
  const routeGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (calculatedGeometry.length < 2) {
      return null;
    }
    return {
      type: 'Feature',
      properties: { type: 'planned-route' },
      geometry: {
        type: 'LineString',
        coordinates: calculatedGeometry.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [calculatedGeometry]);

  // Generate GeoJSON for waypoint display with CircleLayer
  const waypointsGeoJSON = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: 'FeatureCollection',
      features: waypoints.map((wp) => ({
        type: 'Feature' as const,
        id: wp.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [wp.longitude, wp.latitude],
        },
        properties: {
          id: wp.id,
          order: wp.order + 1,
          type: wp.type,
          color: WAYPOINT_COLORS[wp.type] || WAYPOINT_COLORS.via,
        },
      })),
    }),
    [waypoints]
  );

  // Calculate route distance
  const routeDistance = useMemo(() => {
    if (calculatedGeometry.length < 2) return 0;
    return calculatePathDistance(calculatedGeometry);
  }, [calculatedGeometry]);

  // Get duration from current route if available
  const routeDuration = currentRoute?.duration ?? null;

  return {
    routeGeoJSON,
    waypointsGeoJSON,
    routeDistance,
    routeDuration,
  };
}
