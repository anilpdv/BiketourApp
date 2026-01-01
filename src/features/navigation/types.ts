import { Coordinate } from '../routing/types';

/**
 * Navigation state for active bike navigation
 */
export interface NavigationState {
  // Navigation lifecycle
  isNavigating: boolean;
  isPaused: boolean;
  routeId: string | null;
  routeName: string | null;
  routeGeometry: Coordinate[];
  totalDistance: number; // meters

  // Current position
  currentLocation: Coordinate | null;
  currentSpeed: number | null; // m/s from GPS
  smoothedSpeed: number; // m/s after smoothing
  currentHeading: number | null; // degrees

  // Progress tracking
  distanceTraveled: number; // meters
  distanceRemaining: number; // meters
  progressPercent: number; // 0-100

  // Route following
  nearestPointIndex: number;
  distanceFromRoute: number; // meters (perpendicular distance)
  isOffRoute: boolean;

  // Speed history for smoothing
  speedHistory: number[];

  // Error state
  error: string | null;
}

/**
 * Actions for the navigation store
 */
export interface NavigationActions {
  // Lifecycle
  startNavigation: (routeId: string, routeName: string, geometry: Coordinate[], totalDistance: number) => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;

  // Location updates
  updateLocation: (location: Coordinate, speed: number | null, heading: number | null) => void;

  // Error handling
  clearError: () => void;
}

/**
 * Combined navigation store type
 */
export type NavigationStore = NavigationState & NavigationActions;

/**
 * Result from finding nearest point on route
 */
export interface NearestPointResult {
  index: number;
  distance: number; // perpendicular distance in meters
  point: Coordinate; // the nearest point on the route
}

/**
 * Progress calculation result
 */
export interface ProgressResult {
  distanceTraveled: number; // meters
  distanceRemaining: number; // meters
  percent: number; // 0-100
}

/**
 * Off-route detection threshold in meters
 */
export const OFF_ROUTE_THRESHOLD = 50;

/**
 * Number of speed readings to keep for smoothing
 */
export const SPEED_HISTORY_SIZE = 5;
