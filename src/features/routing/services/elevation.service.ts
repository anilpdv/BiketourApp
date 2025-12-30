import { Coordinate, ElevationPoint } from '../types';
import { calculateDistanceMeters, logger } from '../../../shared/utils';
import { httpGet, ApiError } from '../../../shared/api';
import { API_CONFIG } from '../../../shared/config';
import { elevationRepository } from './elevation.repository';

// Max points per request
const MAX_POINTS_PER_REQUEST = 100;

interface ElevationResponse {
  elevation: number[];
}

/**
 * Fetch elevations from API for coordinates (internal helper)
 */
async function fetchElevationsFromAPI(coordinates: Coordinate[]): Promise<number[]> {
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
        logger.warn('api', `Elevation API error: ${error.status}`, error);
      } else {
        logger.error('api', 'Elevation fetch error', error);
      }
      // Return NaN for failed chunk
      allElevations.push(...chunk.map(() => NaN));
    }
  }

  return allElevations;
}

/**
 * Get elevations for an array of coordinates with SQLite caching
 */
export async function getElevations(
  coordinates: Coordinate[]
): Promise<number[]> {
  if (coordinates.length === 0) {
    return [];
  }

  // 1. Check cache for all coordinates
  let cachedElevations: Map<string, number>;
  try {
    cachedElevations = await elevationRepository.getCachedBatch(coordinates);
  } catch (error) {
    logger.warn('cache', 'Elevation cache read error', error);
    cachedElevations = new Map();
  }

  // 2. Identify uncached coordinates
  const uncachedIndices: number[] = [];
  const uncachedCoordinates: Coordinate[] = [];

  for (let i = 0; i < coordinates.length; i++) {
    const cacheKey = elevationRepository.getCacheKey(
      coordinates[i].latitude,
      coordinates[i].longitude
    );
    if (!cachedElevations.has(cacheKey)) {
      uncachedIndices.push(i);
      uncachedCoordinates.push(coordinates[i]);
    }
  }

  // 3. Fetch uncached from API
  let freshElevations: number[] = [];
  if (uncachedCoordinates.length > 0) {
    freshElevations = await fetchElevationsFromAPI(uncachedCoordinates);

    // 4. Persist new elevations to cache (async, non-blocking)
    const dataToCache = uncachedCoordinates
      .map((coord, idx) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        elevation: freshElevations[idx],
      }))
      .filter((item) => !isNaN(item.elevation));

    if (dataToCache.length > 0) {
      elevationRepository.cacheBatch(dataToCache).catch((error) => {
        logger.warn('cache', 'Elevation cache write error', error);
      });
    }
  }

  // 5. Merge results
  const results: number[] = new Array(coordinates.length);
  let freshIdx = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const cacheKey = elevationRepository.getCacheKey(
      coordinates[i].latitude,
      coordinates[i].longitude
    );

    if (cachedElevations.has(cacheKey)) {
      results[i] = cachedElevations.get(cacheKey)!;
    } else {
      results[i] = freshElevations[freshIdx++];
    }
  }

  return results;
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
