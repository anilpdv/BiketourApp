import { Coordinate } from '../../routing/types';
import { NearestPointResult, ProgressResult, SPEED_HISTORY_SIZE } from '../types';
import { calculateHaversineDistance } from '../../routing/services/routing.service';

/**
 * Find the perpendicular distance from a point to a line segment
 * Returns the closest point on the segment and the distance
 */
function pointToSegmentDistance(
  point: Coordinate,
  segmentStart: Coordinate,
  segmentEnd: Coordinate
): { distance: number; closestPoint: Coordinate } {
  const px = point.longitude;
  const py = point.latitude;
  const x1 = segmentStart.longitude;
  const y1 = segmentStart.latitude;
  const x2 = segmentEnd.longitude;
  const y2 = segmentEnd.latitude;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Handle zero-length segment
  if (dx === 0 && dy === 0) {
    return {
      distance: calculateHaversineDistance(point, segmentStart),
      closestPoint: segmentStart,
    };
  }

  // Calculate projection parameter t
  // t = 0 means closest point is segmentStart
  // t = 1 means closest point is segmentEnd
  // 0 < t < 1 means closest point is on the segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  const closestPoint: Coordinate = {
    longitude: x1 + t * dx,
    latitude: y1 + t * dy,
  };

  return {
    distance: calculateHaversineDistance(point, closestPoint),
    closestPoint,
  };
}

/**
 * Find the nearest point on the route to the current location
 * Searches through all segments and returns the closest one
 */
export function findNearestPointOnRoute(
  currentLocation: Coordinate,
  routeGeometry: Coordinate[]
): NearestPointResult {
  if (routeGeometry.length === 0) {
    return {
      index: 0,
      distance: Infinity,
      point: currentLocation,
    };
  }

  if (routeGeometry.length === 1) {
    return {
      index: 0,
      distance: calculateHaversineDistance(currentLocation, routeGeometry[0]),
      point: routeGeometry[0],
    };
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  let nearestPoint = routeGeometry[0];

  // Check each segment
  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const result = pointToSegmentDistance(
      currentLocation,
      routeGeometry[i],
      routeGeometry[i + 1]
    );

    if (result.distance < nearestDistance) {
      nearestDistance = result.distance;
      nearestPoint = result.closestPoint;
      nearestIndex = i;
    }
  }

  return {
    index: nearestIndex,
    distance: nearestDistance,
    point: nearestPoint,
  };
}

/**
 * Calculate cumulative distances for each point in the route
 * Returns an array where distances[i] is the distance from start to point i
 */
export function calculateCumulativeDistances(routeGeometry: Coordinate[]): number[] {
  const distances: number[] = [0];

  for (let i = 1; i < routeGeometry.length; i++) {
    const segmentDistance = calculateHaversineDistance(
      routeGeometry[i - 1],
      routeGeometry[i]
    );
    distances.push(distances[i - 1] + segmentDistance);
  }

  return distances;
}

/**
 * Calculate progress along the route based on nearest point
 */
export function calculateProgress(
  nearestIndex: number,
  nearestPoint: Coordinate,
  routeGeometry: Coordinate[],
  cumulativeDistances: number[],
  totalDistance: number
): ProgressResult {
  if (routeGeometry.length < 2 || totalDistance === 0) {
    return {
      distanceTraveled: 0,
      distanceRemaining: totalDistance,
      percent: 0,
    };
  }

  // Distance from start to the beginning of the segment containing nearest point
  const distanceToSegmentStart = cumulativeDistances[nearestIndex];

  // Distance from segment start to the nearest point
  const distanceInSegment = calculateHaversineDistance(
    routeGeometry[nearestIndex],
    nearestPoint
  );

  const distanceTraveled = distanceToSegmentStart + distanceInSegment;
  const distanceRemaining = Math.max(0, totalDistance - distanceTraveled);
  const percent = Math.min(100, (distanceTraveled / totalDistance) * 100);

  return {
    distanceTraveled,
    distanceRemaining,
    percent,
  };
}

/**
 * Smooth speed readings using a rolling average
 * Helps avoid jumpy speed display
 */
export function smoothSpeed(speedHistory: number[], newSpeed: number): number {
  // Add new speed to history
  const updatedHistory = [...speedHistory, newSpeed].slice(-SPEED_HISTORY_SIZE);

  // Filter out invalid readings (negative or null)
  const validReadings = updatedHistory.filter((s) => s >= 0);

  if (validReadings.length === 0) {
    return 0;
  }

  // Calculate weighted average (more recent readings have higher weight)
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < validReadings.length; i++) {
    const weight = i + 1; // Linear weights: 1, 2, 3, 4, 5
    weightedSum += validReadings[i] * weight;
    totalWeight += weight;
  }

  return weightedSum / totalWeight;
}

/**
 * Convert speed from m/s to km/h
 */
export function metersPerSecondToKmh(mps: number): number {
  return mps * 3.6;
}

/**
 * Format speed for display
 */
export function formatSpeed(mps: number): string {
  const kmh = metersPerSecondToKmh(mps);
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimate time remaining based on current speed and distance
 */
export function estimateTimeRemaining(
  distanceRemaining: number,
  currentSpeedMps: number
): number | null {
  if (currentSpeedMps <= 0.5) {
    // Less than 1.8 km/h is essentially stopped
    return null;
  }

  // Return seconds
  return distanceRemaining / currentSpeedMps;
}

/**
 * Format time for display
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}
