import { create } from 'zustand';
import { Coordinate } from '../../routing/types';
import { NavigationStore, NavigationState, OFF_ROUTE_THRESHOLD } from '../types';
import {
  findNearestPointOnRoute,
  calculateProgress,
  calculateCumulativeDistances,
  smoothSpeed,
} from '../services/navigation.service';
import { logger } from '../../../shared/utils';

const initialState: NavigationState = {
  isNavigating: false,
  isPaused: false,
  routeId: null,
  routeName: null,
  routeGeometry: [],
  totalDistance: 0,

  currentLocation: null,
  currentSpeed: null,
  smoothedSpeed: 0,
  currentHeading: null,

  distanceTraveled: 0,
  distanceRemaining: 0,
  progressPercent: 0,

  nearestPointIndex: 0,
  distanceFromRoute: 0,
  isOffRoute: false,

  speedHistory: [],

  error: null,
};

// Store cumulative distances outside of state (derived data)
let cumulativeDistances: number[] = [];

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  startNavigation: (routeId, routeName, geometry, totalDistance) => {
    logger.info('navigation', `Starting navigation for route: ${routeName}`);

    // Pre-calculate cumulative distances
    cumulativeDistances = calculateCumulativeDistances(geometry);

    set({
      isNavigating: true,
      isPaused: false,
      routeId,
      routeName,
      routeGeometry: geometry,
      totalDistance,
      currentLocation: null,
      currentSpeed: null,
      smoothedSpeed: 0,
      currentHeading: null,
      distanceTraveled: 0,
      distanceRemaining: totalDistance,
      progressPercent: 0,
      nearestPointIndex: 0,
      distanceFromRoute: 0,
      isOffRoute: false,
      speedHistory: [],
      error: null,
    });
  },

  pauseNavigation: () => {
    logger.info('navigation', 'Navigation paused');
    set({ isPaused: true });
  },

  resumeNavigation: () => {
    logger.info('navigation', 'Navigation resumed');
    set({ isPaused: false });
  },

  stopNavigation: () => {
    logger.info('navigation', 'Navigation stopped');
    cumulativeDistances = [];
    set(initialState);
  },

  updateLocation: (location, speed, heading) => {
    const state = get();

    if (!state.isNavigating || state.isPaused) {
      return;
    }

    if (state.routeGeometry.length === 0) {
      set({ currentLocation: location, currentSpeed: speed, currentHeading: heading });
      return;
    }

    try {
      // Find nearest point on route
      const nearest = findNearestPointOnRoute(location, state.routeGeometry);

      // Calculate progress
      const progress = calculateProgress(
        nearest.index,
        nearest.point,
        state.routeGeometry,
        cumulativeDistances,
        state.totalDistance
      );

      // Smooth speed
      const validSpeed = speed !== null && speed >= 0 ? speed : 0;
      const newSpeedHistory = [...state.speedHistory, validSpeed].slice(-5);
      const newSmoothedSpeed = smoothSpeed(state.speedHistory, validSpeed);

      // Check if off route
      const isOffRoute = nearest.distance > OFF_ROUTE_THRESHOLD;

      if (isOffRoute && !state.isOffRoute) {
        logger.warn('navigation', `Off route! Distance: ${nearest.distance.toFixed(0)}m`);
      }

      set({
        currentLocation: location,
        currentSpeed: speed,
        smoothedSpeed: newSmoothedSpeed,
        currentHeading: heading,
        nearestPointIndex: nearest.index,
        distanceFromRoute: nearest.distance,
        isOffRoute,
        distanceTraveled: progress.distanceTraveled,
        distanceRemaining: progress.distanceRemaining,
        progressPercent: progress.percent,
        speedHistory: newSpeedHistory,
      });
    } catch (error) {
      logger.error('navigation', 'Error updating location', error);
      set({
        currentLocation: location,
        currentSpeed: speed,
        currentHeading: heading,
        error: 'Failed to update navigation',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectIsNavigating = (state: NavigationStore) => state.isNavigating;
export const selectIsPaused = (state: NavigationStore) => state.isPaused;
export const selectProgress = (state: NavigationStore) => ({
  distanceTraveled: state.distanceTraveled,
  distanceRemaining: state.distanceRemaining,
  progressPercent: state.progressPercent,
});
export const selectIsOffRoute = (state: NavigationStore) => state.isOffRoute;
