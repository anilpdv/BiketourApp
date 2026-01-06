/**
 * Route Segment Utilities
 * Functions for detecting which segment of a route was clicked/dragged
 * and determining the correct insertion index for new via waypoints
 */

import { Coordinate, Waypoint } from '../types';
import {
  calculateDistanceMeters,
  findNearestPointOnRoute,
  calculatePathDistance,
} from '../../../shared/utils/geo.utils';

export interface SegmentInfo {
  /** Index of the segment (0 = between waypoint 0 and 1) */
  segmentIndex: number;
  /** Position to insert new waypoint in waypoints array */
  insertAtIndex: number;
  /** Index in calculatedGeometry of the nearest point */
  nearestGeometryIndex: number;
  /** Distance in meters from pressed point to route */
  distanceToRoute: number;
  /** The coordinate on the route nearest to the pressed point */
  nearestCoordinate: Coordinate;
}

/**
 * Find which segment of the route was clicked and where to insert a new via waypoint
 *
 * @param pressedCoord - The coordinate where the user pressed
 * @param waypoints - Current waypoints array
 * @param calculatedGeometry - Full route geometry from OSRM
 * @returns SegmentInfo with insertion details, or null if no valid segment found
 */
export function findRouteSegmentForInsertion(
  pressedCoord: Coordinate,
  waypoints: Waypoint[],
  calculatedGeometry: Coordinate[]
): SegmentInfo | null {
  if (waypoints.length < 2 || calculatedGeometry.length < 2) {
    return null;
  }

  // Step 1: Find the nearest point on the route geometry
  const nearest = findNearestPointOnRoute(
    calculatedGeometry,
    pressedCoord.latitude,
    pressedCoord.longitude
  );

  if (nearest.index === -1) {
    return null;
  }

  const nearestCoordinate = calculatedGeometry[nearest.index];
  const distanceToRoute = nearest.distance * 1000; // Convert km to meters

  // Step 2: Calculate cumulative distances to each point in geometry
  const cumulativeDistances = calculateCumulativeDistances(calculatedGeometry);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  // Step 3: Find the cumulative distance to the nearest point
  const distanceToNearestPoint = cumulativeDistances[nearest.index];

  // Step 4: Find cumulative distances to each waypoint
  const waypointDistances = findWaypointDistancesAlongRoute(
    waypoints,
    calculatedGeometry,
    cumulativeDistances
  );

  // Step 5: Determine which segment the nearest point falls into
  let segmentIndex = 0;
  for (let i = 0; i < waypointDistances.length - 1; i++) {
    if (
      distanceToNearestPoint >= waypointDistances[i] &&
      distanceToNearestPoint <= waypointDistances[i + 1]
    ) {
      segmentIndex = i;
      break;
    }
  }

  // The insertion index is after the current segment's start waypoint
  const insertAtIndex = segmentIndex + 1;

  return {
    segmentIndex,
    insertAtIndex,
    nearestGeometryIndex: nearest.index,
    distanceToRoute,
    nearestCoordinate,
  };
}

/**
 * Calculate cumulative distances along a route
 * @returns Array where each element is the cumulative distance from start to that point
 */
export function calculateCumulativeDistances(geometry: Coordinate[]): number[] {
  if (geometry.length === 0) return [];
  if (geometry.length === 1) return [0];

  const distances: number[] = [0];
  let cumulative = 0;

  for (let i = 1; i < geometry.length; i++) {
    cumulative += calculateDistanceMeters(geometry[i - 1], geometry[i]);
    distances.push(cumulative);
  }

  return distances;
}

/**
 * Find the cumulative distance along the route to each waypoint
 * by finding where each waypoint falls on the route geometry
 */
function findWaypointDistancesAlongRoute(
  waypoints: Waypoint[],
  geometry: Coordinate[],
  cumulativeDistances: number[]
): number[] {
  return waypoints.map((wp) => {
    // Find the nearest point on the geometry to this waypoint
    const nearest = findNearestPointOnRoute(geometry, wp.latitude, wp.longitude);
    if (nearest.index === -1) {
      return 0;
    }
    return cumulativeDistances[nearest.index];
  });
}

/**
 * Check if a pressed coordinate is close enough to the route to be considered a route press
 * @param distanceMeters - Distance from pressed point to route in meters
 * @param thresholdMeters - Maximum distance to consider as a route press (default 50m)
 */
export function isWithinRouteThreshold(
  distanceMeters: number,
  thresholdMeters: number = 50
): boolean {
  return distanceMeters <= thresholdMeters;
}

/**
 * Find the coordinate on the route geometry at a given distance from the start
 * Useful for elevation chart position highlighting
 */
export function findCoordinateAtDistance(
  geometry: Coordinate[],
  targetDistance: number,
  cumulativeDistances?: number[]
): Coordinate | null {
  if (geometry.length === 0) return null;
  if (geometry.length === 1) return geometry[0];

  const distances = cumulativeDistances || calculateCumulativeDistances(geometry);

  // Find the segment that contains the target distance
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      // Interpolate between points i-1 and i
      const segmentStart = distances[i - 1];
      const segmentEnd = distances[i];
      const segmentLength = segmentEnd - segmentStart;

      if (segmentLength === 0) {
        return geometry[i - 1];
      }

      const ratio = (targetDistance - segmentStart) / segmentLength;
      const startPoint = geometry[i - 1];
      const endPoint = geometry[i];

      return {
        latitude: startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio,
        longitude: startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio,
      };
    }
  }

  // Target distance is beyond the route, return the last point
  return geometry[geometry.length - 1];
}
