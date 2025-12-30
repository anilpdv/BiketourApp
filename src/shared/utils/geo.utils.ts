/**
 * Geographic utility functions
 * Centralized distance calculations and coordinate utilities
 */

import { Coordinate } from '../types/geo.types';

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two points
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate distance between two Coordinate objects
 * @returns Distance in meters
 */
export function calculateDistanceMeters(
  point1: Coordinate,
  point2: Coordinate
): number {
  const dLat = degreesToRadians(point2.latitude - point1.latitude);
  const dLon = degreesToRadians(point2.longitude - point1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(point1.latitude)) *
      Math.cos(degreesToRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate distance between two Coordinate objects
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  point1: Coordinate,
  point2: Coordinate
): number {
  return calculateHaversineDistance(
    point1.latitude,
    point1.longitude,
    point2.latitude,
    point2.longitude
  );
}

/**
 * Calculate total path distance from an array of coordinates
 * @returns Total distance in meters
 */
export function calculatePathDistance(coordinates: Coordinate[]): number {
  if (coordinates.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += calculateDistanceMeters(coordinates[i - 1], coordinates[i]);
  }
  return total;
}

/**
 * Check if a coordinate is within a bounding box
 */
export function isWithinBounds(
  coord: Coordinate,
  south: number,
  west: number,
  north: number,
  east: number
): boolean {
  return (
    coord.latitude >= south &&
    coord.latitude <= north &&
    coord.longitude >= west &&
    coord.longitude <= east
  );
}

/**
 * Find the nearest point on a route to a given position
 * @returns Object with index of nearest point and distance to it in km
 */
export function findNearestPointOnRoute(
  routePoints: Coordinate[],
  lat: number,
  lon: number
): { index: number; distance: number } {
  if (routePoints.length === 0) {
    return { index: -1, distance: Infinity };
  }

  let nearestIndex = 0;
  let minDistance = calculateHaversineDistance(
    lat,
    lon,
    routePoints[0].latitude,
    routePoints[0].longitude
  );

  for (let i = 1; i < routePoints.length; i++) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      routePoints[i].latitude,
      routePoints[i].longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return { index: nearestIndex, distance: minDistance };
}

/**
 * Get a segment of route points ahead of a starting index for a given distance
 * @param routePoints Array of route coordinates
 * @param startIndex Index to start from
 * @param distanceKm Distance ahead to include (in km)
 * @returns Array of route points within the distance
 */
export function getRouteSegmentAhead(
  routePoints: Coordinate[],
  startIndex: number,
  distanceKm: number
): Coordinate[] {
  if (routePoints.length === 0 || startIndex < 0 || startIndex >= routePoints.length) {
    return [];
  }

  const segment: Coordinate[] = [routePoints[startIndex]];
  let accumulatedDistance = 0;

  for (let i = startIndex + 1; i < routePoints.length; i++) {
    const distance = calculateHaversineDistance(
      routePoints[i - 1].latitude,
      routePoints[i - 1].longitude,
      routePoints[i].latitude,
      routePoints[i].longitude
    );
    accumulatedDistance += distance;

    if (accumulatedDistance > distanceKm) {
      break;
    }

    segment.push(routePoints[i]);
  }

  return segment;
}

/**
 * Calculate bounding box for an array of coordinates with optional buffer
 */
export function getBoundingBox(
  points: Coordinate[],
  bufferKm: number = 0
): { south: number; north: number; west: number; east: number } | null {
  if (points.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  if (bufferKm > 0) {
    const latBuffer = bufferKm / 111; // ~111km per degree latitude
    const avgLat = (minLat + maxLat) / 2;
    const lonBuffer = bufferKm / (111 * Math.cos(avgLat * (Math.PI / 180)));

    minLat -= latBuffer;
    maxLat += latBuffer;
    minLon -= lonBuffer;
    maxLon += lonBuffer;
  }

  return { south: minLat, north: maxLat, west: minLon, east: maxLon };
}

/**
 * Split a route into fixed-length segments for progressive loading
 * @param routePoints Array of route coordinates
 * @param segmentLengthKm Target length of each segment in km (default 50km)
 * @returns Array of segments, each containing an array of coordinates
 */
export function splitRouteIntoSegments(
  routePoints: Coordinate[],
  segmentLengthKm: number = 50
): Coordinate[][] {
  if (routePoints.length === 0) return [];
  if (routePoints.length === 1) return [[routePoints[0]]];

  const segments: Coordinate[][] = [];
  let currentSegment: Coordinate[] = [routePoints[0]];
  let currentSegmentDistance = 0;

  for (let i = 1; i < routePoints.length; i++) {
    const distance = calculateHaversineDistance(
      routePoints[i - 1].latitude,
      routePoints[i - 1].longitude,
      routePoints[i].latitude,
      routePoints[i].longitude
    );

    currentSegmentDistance += distance;
    currentSegment.push(routePoints[i]);

    // If we've exceeded the segment length, start a new segment
    if (currentSegmentDistance >= segmentLengthKm) {
      segments.push(currentSegment);
      // Start new segment with the last point (overlap for continuity)
      currentSegment = [routePoints[i]];
      currentSegmentDistance = 0;
    }
  }

  // Don't forget the last segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}
