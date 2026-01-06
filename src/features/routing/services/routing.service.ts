import { Coordinate, CalculatedRoute, Waypoint, RouteInstruction, RoutingProfile, RoutingProvider } from '../types';
import { httpGet } from '../../../shared/api';
import { API_CONFIG } from '../../../shared/config';
import { logger, formatDistance, formatDuration, calculateDistanceMeters } from '../../../shared/utils';

// OSRM API base URLs from centralized config
const OSRM_API = API_CONFIG.routing.baseUrl;
const OSRM_BIKE_API = API_CONFIG.routing.cyclingUrl;

// OSRM profile type
type OSRMProfile = 'driving' | 'foot' | 'bike';

/**
 * Get the appropriate OSRM base URL for a given profile
 */
function getOSRMBaseUrl(profile: RoutingProfile): string {
  if (profile === 'cycling') {
    return OSRM_BIKE_API;
  }
  return OSRM_API;
}

/**
 * Get the OSRM profile name for a given routing profile
 */
function getOSRMProfileName(profile: RoutingProfile): string {
  switch (profile) {
    case 'cycling':
      return 'bike';
    case 'driving':
      return 'driving';
    case 'foot':
      return 'foot';
    default:
      return 'bike';
  }
}

interface RoutingOptions {
  profile?: RoutingProfile;
  provider?: RoutingProvider;
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

// Mapbox Directions API types
interface MapboxDirectionsResponse {
  code: string;
  routes: MapboxRoute[];
  waypoints: MapboxWaypoint[];
}

interface MapboxRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: MapboxRouteLeg[];
}

interface MapboxRouteLeg {
  distance: number;
  duration: number;
  steps?: MapboxRouteStep[];
}

interface MapboxRouteStep {
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    instruction: string;
    modifier?: string;
    location: [number, number];
  };
  name: string;
}

interface MapboxWaypoint {
  location: [number, number];
  name: string;
}

/**
 * Calculate a cycling route using OSRM bike server (FREE, no API key required)
 * Uses https://routing.openstreetmap.de/routed-bike/ which has the same API as OSRM
 */
export async function calculateCyclingRoute(
  waypoints: Coordinate[],
  options: { alternatives?: boolean; steps?: boolean } = {}
): Promise<CalculatedRoute> {
  // Delegate to OSRM route calculation with cycling profile
  return calculateOSRMRoute(waypoints, {
    profile: 'cycling',
    alternatives: options.alternatives,
    steps: options.steps,
  });
}

/**
 * Calculate a route using OSRM (supports cycling, driving, foot profiles)
 * Cycling uses a dedicated bike server, others use the main OSRM server
 */
export async function calculateOSRMRoute(
  waypoints: Coordinate[],
  options: RoutingOptions = {}
): Promise<CalculatedRoute> {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }

  const profile = options.profile || 'cycling';
  const baseUrl = getOSRMBaseUrl(profile);
  const osrmProfile = getOSRMProfileName(profile);

  const coords = waypoints
    .map((wp) => `${wp.longitude},${wp.latitude}`)
    .join(';');

  const params = new URLSearchParams({
    alternatives: String(options.alternatives || false),
    steps: String(options.steps || true),
    overview: options.overview || 'full',
    geometries: 'geojson',
  });

  const url = `${baseUrl}/route/v1/${osrmProfile}/${coords}?${params}`;

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
    logger.error('api', 'OSRM routing error', error);
    throw error;
  }
}

/**
 * Unified route calculation - all profiles now use OSRM (different servers)
 * Cycling uses the dedicated OSRM bike server (free, no API key)
 * Driving/foot use the main OSRM demo server
 */
export async function calculateRoute(
  waypoints: Coordinate[],
  options: RoutingOptions = {}
): Promise<CalculatedRoute> {
  const profile = options.profile || 'cycling';

  // All profiles now use OSRM - cycling gets routed to the bike server automatically
  return calculateOSRMRoute(waypoints, {
    ...options,
    profile,
  });
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
  profile: OSRMProfile = 'driving'
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

// formatDistance and formatDuration are imported from shared/utils/formatters.ts
// calculateDistanceMeters replaces the local calculateHaversineDistance
// Re-export for backward compatibility
export { formatDistance, formatDuration };
export { calculateDistanceMeters as calculateHaversineDistance };

/**
 * Calculate total distance of a path
 * Uses calculateDistanceMeters from shared geo.utils
 */
export function calculatePathDistance(path: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += calculateDistanceMeters(path[i - 1], path[i]);
  }
  return total;
}
