/**
 * Route Adapter Service
 * Converts different route types to a common format for trip planning
 */

import { CustomRoute, Coordinate } from '../../routing/types';
import { ParsedRoute, RoutePoint } from '../../routes/types';
import { calculateDistanceKm } from '../../../shared/utils/geo.utils';
import type { RouteSource } from '../types';

/**
 * Convert a CustomRoute (user-drawn or imported) to ParsedRoute format
 * This allows custom routes to be used with the trip planning system
 */
export function customRouteToPlannableRoute(route: CustomRoute): ParsedRoute {
  // Convert geometry to RoutePoints with cumulative distance
  const points = calculateRoutePointsWithDistance(route.geometry);

  // Calculate bounds from geometry
  const bounds = calculateBounds(route.geometry);

  return {
    id: route.id,
    euroVeloId: 0, // Not a EuroVelo route
    variant: 'full',
    name: route.name,
    points,
    segments: [points], // Single segment for custom routes
    totalDistance: route.distance / 1000, // Convert meters to km
    elevationGain: route.elevationGain,
    elevationLoss: route.elevationLoss,
    color: '#4A90D9', // Default blue for custom routes
    bounds,
  };
}

/**
 * Calculate RoutePoints with cumulative distance from start
 */
function calculateRoutePointsWithDistance(geometry: Coordinate[]): RoutePoint[] {
  if (geometry.length === 0) return [];

  let cumulativeDistanceKm = 0;
  const points: RoutePoint[] = geometry.map((coord, index) => {
    if (index > 0) {
      cumulativeDistanceKm += calculateDistanceKm(geometry[index - 1], coord);
    }

    return {
      latitude: coord.latitude,
      longitude: coord.longitude,
      distanceFromStart: cumulativeDistanceKm,
    };
  });

  return points;
}

/**
 * Calculate bounding box from coordinates
 */
function calculateBounds(geometry: Coordinate[]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  if (geometry.length === 0) {
    return { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const coord of geometry) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLon = Math.min(minLon, coord.longitude);
    maxLon = Math.max(maxLon, coord.longitude);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Get display info for a route source
 */
export function getRouteSourceLabel(routeSource: RouteSource): string {
  switch (routeSource.type) {
    case 'eurovelo':
      return `EuroVelo ${routeSource.euroVeloId}`;
    case 'custom':
      return 'My Route';
    case 'imported':
      return 'Imported';
    default:
      return 'Route';
  }
}

/**
 * Get color for a route based on its source
 */
export function getRouteSourceColor(routeSource: RouteSource): string {
  switch (routeSource.type) {
    case 'eurovelo':
      // EuroVelo routes have their own colors
      return '#2E7D32'; // Default green for EuroVelo
    case 'custom':
      return '#4A90D9'; // Blue for custom routes
    case 'imported':
      return '#9C27B0'; // Purple for imported routes
    default:
      return '#757575';
  }
}
