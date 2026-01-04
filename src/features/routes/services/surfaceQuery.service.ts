/**
 * Surface Query Service
 * Fetches road surface data from OpenStreetMap for route segments
 */

import { API_CONFIG } from '../../../shared/config';
import { fetchWithTimeout } from '../../../shared/api/httpClient';
import { logger } from '../../../shared/utils';
import {
  RoutePoint,
  SurfaceType,
  SurfaceSegment,
  RouteSurfaceData,
  SURFACE_TAG_MAP,
} from '../types';

// Overpass API response types
interface OverpassWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: {
    surface?: string;
    highway?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OverpassResponse {
  elements: (OverpassWay | OverpassNode)[];
}

/**
 * Convert OSM surface tag to SurfaceType
 */
function parseSurfaceTag(surface: string | undefined): SurfaceType {
  if (!surface) return 'unknown';
  const normalized = surface.toLowerCase().trim();
  return SURFACE_TAG_MAP[normalized] || 'unknown';
}

/**
 * Build Overpass query for ways along a route
 * Uses a bounding box around the route points
 */
function buildSurfaceQuery(points: RoutePoint[], bufferKm: number = 0.5): string {
  // Calculate bounding box with buffer
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  // Add buffer (roughly 0.01 degrees per km at mid-latitudes)
  const buffer = bufferKm * 0.01;
  minLat -= buffer;
  maxLat += buffer;
  minLon -= buffer;
  maxLon += buffer;

  // Query for ways with highway tag (roads/paths) that have surface info
  return `
    [out:json][timeout:30];
    (
      way["highway"]["surface"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"](${minLat},${minLon},${maxLat},${maxLon});
    );
    out body;
    >;
    out skel qt;
  `;
}

/**
 * Find the nearest way to a route point
 */
function findNearestWay(
  point: RoutePoint,
  ways: OverpassWay[],
  nodeMap: Map<number, { lat: number; lon: number }>
): OverpassWay | null {
  let nearestWay: OverpassWay | null = null;
  let minDistance = Infinity;

  for (const way of ways) {
    // Check each node in the way
    for (const nodeId of way.nodes) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      // Simple distance calculation (good enough for nearby points)
      const dx = node.lon - point.longitude;
      const dy = node.lat - point.latitude;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestWay = way;
      }
    }
  }

  // Only return if within ~50m (roughly 0.0005 degrees)
  if (minDistance > 0.0005) return null;
  return nearestWay;
}

/**
 * Query OSM for surface data along a route segment
 */
export async function querySurfaceForSegment(
  points: RoutePoint[],
  signal?: AbortSignal
): Promise<SurfaceSegment[]> {
  if (points.length < 2) return [];

  const query = buildSurfaceQuery(points);

  try {
    const response = await fetchWithTimeout(
      API_CONFIG.pois.baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      },
      30000,
      signal
    );

    if (!response.ok) {
      logger.warn('surface', 'Overpass API error', { status: response.status });
      return [];
    }

    const data: OverpassResponse = await response.json();

    // Build node map for coordinate lookup
    const nodeMap = new Map<number, { lat: number; lon: number }>();
    const ways: OverpassWay[] = [];

    for (const element of data.elements) {
      if (element.type === 'node') {
        nodeMap.set(element.id, { lat: element.lat, lon: element.lon });
      } else if (element.type === 'way') {
        ways.push(element);
      }
    }

    // Match route points to OSM ways and extract surface info
    const segments: SurfaceSegment[] = [];
    let currentSurface: SurfaceType = 'unknown';
    let segmentStart = 0;
    let segmentCoords: [number, number][] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const nearestWay = findNearestWay(point, ways, nodeMap);
      const surface = nearestWay
        ? parseSurfaceTag(nearestWay.tags?.surface)
        : 'unknown';

      // If surface changed, save previous segment and start new one
      if (surface !== currentSurface && segmentCoords.length > 0) {
        segments.push({
          surface: currentSurface,
          coordinates: segmentCoords,
          startIndex: segmentStart,
          endIndex: i - 1,
        });
        segmentStart = i;
        segmentCoords = [];
      }

      currentSurface = surface;
      segmentCoords.push([point.longitude, point.latitude]);
    }

    // Don't forget the last segment
    if (segmentCoords.length > 0) {
      segments.push({
        surface: currentSurface,
        coordinates: segmentCoords,
        startIndex: segmentStart,
        endIndex: points.length - 1,
      });
    }

    return segments;
  } catch (error) {
    logger.warn('surface', 'Failed to query surface data', error);
    return [];
  }
}

/**
 * Query surface data for an entire route (in chunks to avoid timeout)
 */
export async function querySurfaceForRoute(
  routeId: string,
  points: RoutePoint[],
  onProgress?: (loaded: number, total: number) => void
): Promise<RouteSurfaceData> {
  const CHUNK_SIZE = 500; // Points per chunk
  const allSegments: SurfaceSegment[] = [];

  // Split route into chunks
  const chunks: RoutePoint[][] = [];
  for (let i = 0; i < points.length; i += CHUNK_SIZE) {
    // Overlap by 1 point to ensure continuity
    const start = i > 0 ? i - 1 : i;
    chunks.push(points.slice(start, i + CHUNK_SIZE));
  }

  logger.info('surface', `Querying surface data for ${chunks.length} chunks`);

  let loadedChunks = 0;
  for (const chunk of chunks) {
    const segments = await querySurfaceForSegment(chunk);
    allSegments.push(...segments);
    loadedChunks++;
    onProgress?.(loadedChunks, chunks.length);
  }

  // Calculate summary percentages
  let totalPoints = 0;
  const surfaceCounts: Record<SurfaceType, number> = {
    paved: 0,
    gravel: 0,
    unpaved: 0,
    unknown: 0,
  };

  for (const segment of allSegments) {
    const pointCount = segment.coordinates.length;
    totalPoints += pointCount;
    surfaceCounts[segment.surface] += pointCount;
  }

  const summary = {
    paved: totalPoints > 0 ? Math.round((surfaceCounts.paved / totalPoints) * 100) : 0,
    gravel: totalPoints > 0 ? Math.round((surfaceCounts.gravel / totalPoints) * 100) : 0,
    unpaved: totalPoints > 0 ? Math.round((surfaceCounts.unpaved / totalPoints) * 100) : 0,
    unknown: totalPoints > 0 ? Math.round((surfaceCounts.unknown / totalPoints) * 100) : 0,
  };

  logger.info('surface', 'Surface data complete', {
    routeId,
    segments: allSegments.length,
    summary,
  });

  return {
    routeId,
    segments: allSegments,
    summary,
  };
}

/**
 * Merge adjacent segments with the same surface type
 */
export function mergeAdjacentSegments(segments: SurfaceSegment[]): SurfaceSegment[] {
  if (segments.length === 0) return [];

  const merged: SurfaceSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.surface === current.surface) {
      // Merge: extend coordinates and end index
      current.coordinates = [...current.coordinates, ...segment.coordinates.slice(1)];
      current.endIndex = segment.endIndex;
    } else {
      // Different surface: save current and start new
      merged.push(current);
      current = { ...segment };
    }
  }

  // Don't forget the last one
  merged.push(current);

  return merged;
}
