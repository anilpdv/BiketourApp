import { Coordinate, CalculatedRoute, Waypoint, RouteInstruction } from '../types';
import { httpGet, ApiError } from '../../../shared/api';
import { API_CONFIG } from '../../../shared/config';

// OSRM API base URL from centralized config
const OSRM_API = API_CONFIG.routing.baseUrl;

// Routing profile - using 'driving' and 'foot' which are supported by OSRM demo server
type RoutingProfile = 'driving' | 'foot';

interface RoutingOptions {
  profile?: RoutingProfile;
  alternatives?: boolean;
  steps?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  geometries?: 'polyline' | 'polyline6' | 'geojson';
}

interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: OSRMWaypoint[];
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: OSRMRouteLeg[];
}

interface OSRMRouteLeg {
  distance: number;
  duration: number;
  steps?: OSRMRouteStep[];
}

interface OSRMRouteStep {
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
  name: string;
}

interface OSRMWaypoint {
  location: [number, number];
  name: string;
}

/**
 * Calculate a bike route using OSRM
 */
export async function calculateRoute(
  waypoints: Coordinate[],
  options: RoutingOptions = {}
): Promise<CalculatedRoute> {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }

  const profile = options.profile || 'driving';
  const coords = waypoints
    .map((wp) => `${wp.longitude},${wp.latitude}`)
    .join(';');

  const params = new URLSearchParams({
    alternatives: String(options.alternatives || false),
    steps: String(options.steps || true),
    overview: options.overview || 'full',
    geometries: 'geojson',
  });

  const url = `${OSRM_API}/${profile}/${coords}?${params}`;

  try {
    const data = await httpGet<OSRMResponse>(url, {
      timeout: API_CONFIG.routing.timeout,
    });

    if (data.code !== 'Ok') {
      throw new Error(`OSRM routing failed: ${data.code}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    // Convert geometry to our format
    const geometry: Coordinate[] = route.geometry.coordinates.map(
      ([lon, lat]) => ({
        latitude: lat,
        longitude: lon,
      })
    );

    // Convert waypoints to our format
    const resultWaypoints: Waypoint[] = data.waypoints.map((wp, index) => ({
      id: `wp-${index}`,
      latitude: wp.location[1],
      longitude: wp.location[0],
      name: wp.name || undefined,
      type: index === 0 ? 'start' : index === data.waypoints.length - 1 ? 'end' : 'via',
      order: index,
    }));

    // Convert instructions
    const instructions: RouteInstruction[] = [];
    for (const leg of route.legs) {
      if (leg.steps) {
        for (const step of leg.steps) {
          instructions.push({
            type: step.maneuver.type,
            text: step.name || step.maneuver.type,
            distance: step.distance,
            duration: step.duration,
            modifier: step.maneuver.modifier,
          });
        }
      }
    }

    return {
      waypoints: resultWaypoints,
      geometry,
      distance: route.distance,
      duration: route.duration,
      instructions: instructions.length > 0 ? instructions : undefined,
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    throw error;
  }
}

// Response type for OSRM nearest endpoint
interface OSRMNearestResponse {
  code: string;
  waypoints: Array<{
    location: [number, number]; // [lon, lat]
    distance: number;
    name: string;
  }>;
}

/**
 * Snap a point to the nearest road using OSRM nearest endpoint
 */
export async function snapToRoad(
  point: Coordinate,
  profile: RoutingProfile = 'driving'
): Promise<Coordinate> {
  // Use /nearest/v1/ endpoint instead of /route/v1/
  // Note: OSRM nearest uses same base domain but different path
  const url = `https://router.project-osrm.org/nearest/v1/${profile}/${point.longitude},${point.latitude}?number=1`;

  try {
    const data = await httpGet<OSRMNearestResponse>(url, {
      timeout: API_CONFIG.routing.timeout,
    });

    if (data.code !== 'Ok' || !data.waypoints || data.waypoints.length === 0) {
      return point;
    }

    return {
      latitude: data.waypoints[0].location[1],
      longitude: data.waypoints[0].location[0],
    };
  } catch {
    return point; // Return original on error
  }
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
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate straight-line distance between two points (Haversine)
 */
export function calculateHaversineDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total distance of a path
 */
export function calculatePathDistance(path: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += calculateHaversineDistance(path[i - 1], path[i]);
  }
  return total;
}
