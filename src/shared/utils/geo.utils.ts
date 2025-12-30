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
