import { Coordinate, ElevationPoint } from '../types';
import { calculateDistanceMeters } from '../../../shared/utils';
import { httpGet, ApiError } from '../../../shared/api';
import { API_CONFIG } from '../../../shared/config';

// Max points per request
const MAX_POINTS_PER_REQUEST = 100;

interface ElevationResponse {
  elevation: number[];
}

/**
 * Get elevations for an array of coordinates
 */
export async function getElevations(
  coordinates: Coordinate[]
): Promise<number[]> {
  if (coordinates.length === 0) {
    return [];
  }

  // Split into chunks if needed
  const chunks: Coordinate[][] = [];
  for (let i = 0; i < coordinates.length; i += MAX_POINTS_PER_REQUEST) {
    chunks.push(coordinates.slice(i, i + MAX_POINTS_PER_REQUEST));
  }

  const allElevations: number[] = [];

  for (const chunk of chunks) {
    const latitudes = chunk.map((c) => c.latitude).join(',');
    const longitudes = chunk.map((c) => c.longitude).join(',');

    const url = `${API_CONFIG.elevation.baseUrl}/elevation?latitude=${latitudes}&longitude=${longitudes}`;

    try {
      const data = await httpGet<ElevationResponse>(url, {
        timeout: API_CONFIG.elevation.timeout,
      });
      allElevations.push(...data.elevation);
    } catch (error) {
      if (error instanceof ApiError) {
        console.warn(`Elevation API error: ${error.status} - ${error.message}`);
      } else {
        console.error('Elevation fetch error:', error);
      }
      // Return NaN for failed chunk
      allElevations.push(...chunk.map(() => NaN));
    }
  }

  return allElevations;
}

/**
 * Calculate elevation statistics from an array of elevations
 */
export function calculateElevationStats(
  elevations: number[]
): { gain: number; loss: number; max: number; min: number } {
  const validElevations = elevations.filter((e) => !isNaN(e));

  if (validElevations.length === 0) {
    return { gain: 0, loss: 0, max: 0, min: 0 };
  }

  let gain = 0;
  let loss = 0;
  let max = validElevations[0];
  let min = validElevations[0];

  for (let i = 1; i < validElevations.length; i++) {
    const diff = validElevations[i] - validElevations[i - 1];
    if (diff > 0) {
      gain += diff;
    } else {
      loss += Math.abs(diff);
    }
    max = Math.max(max, validElevations[i]);
    min = Math.min(min, validElevations[i]);
  }

  return { gain, loss, max, min };
}

/**
 * Create elevation profile data for charting
 */
export function createElevationProfile(
  coordinates: Coordinate[],
  elevations: number[]
): ElevationPoint[] {
  const profile: ElevationPoint[] = [];
  let totalDistance = 0;

  for (let i = 0; i < coordinates.length; i++) {
    if (!isNaN(elevations[i])) {
      profile.push({
        distance: totalDistance,
        elevation: elevations[i],
      });
    }

    // Calculate distance to next point
    if (i < coordinates.length - 1) {
      totalDistance += calculateDistanceMeters(coordinates[i], coordinates[i + 1]);
    }
  }

  return profile;
}

/**
 * Sample coordinates for elevation (reduce number of API calls)
 */
export function sampleCoordinates(
  coordinates: Coordinate[],
  maxPoints: number = 100
): { sampled: Coordinate[]; indices: number[] } {
  if (coordinates.length <= maxPoints) {
    return {
      sampled: coordinates,
      indices: coordinates.map((_, i) => i),
    };
  }

  const step = (coordinates.length - 1) / (maxPoints - 1);
  const sampled: Coordinate[] = [];
  const indices: number[] = [];

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    sampled.push(coordinates[index]);
    indices.push(index);
  }

  return { sampled, indices };
}
