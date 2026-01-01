import { useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useNavigationStore } from '../store/navigationStore';
import { CustomRoute } from '../../routing/types';
import { logger } from '../../../shared/utils';
import {
  metersPerSecondToKmh,
  formatSpeed,
  formatDistance,
  formatTime,
  estimateTimeRemaining,
} from '../services/navigation.service';

export interface UseActiveNavigationReturn {
  // State
  isNavigating: boolean;
  isPaused: boolean;
  routeName: string | null;

  // Current metrics
  currentSpeedKmh: number;
  formattedSpeed: string;

  // Progress
  distanceTraveled: number;
  distanceRemaining: number;
  progressPercent: number;
  formattedDistanceRemaining: string;
  formattedDistanceTraveled: string;

  // Time
  estimatedTimeRemaining: number | null;
  formattedTimeRemaining: string;

  // Route following
  isOffRoute: boolean;
  distanceFromRoute: number;

  // Error
  error: string | null;

  // Actions
  startNavigation: (route: CustomRoute) => Promise<void>;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  clearError: () => void;
}

/**
 * Hook for active GPS navigation along a route
 * Handles continuous location tracking and progress updates
 */
export function useActiveNavigation(): UseActiveNavigationReturn {
  const store = useNavigationStore();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Start navigation with continuous GPS tracking
  const startNavigation = useCallback(async (route: CustomRoute) => {
    logger.info('navigation', `Starting navigation for: ${route.name}`);

    // Check permissions first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      logger.error('navigation', 'Location permission denied');
      return;
    }

    // Initialize the store
    store.startNavigation(route.id, route.name, route.geometry, route.distance);

    // Start continuous location tracking
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 5, // Or every 5 meters
        },
        (location) => {
          store.updateLocation(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            location.coords.speed, // m/s, can be null
            location.coords.heading // degrees, can be null
          );
        }
      );
      logger.info('navigation', 'GPS tracking started');
    } catch (error) {
      logger.error('navigation', 'Failed to start GPS tracking', error);
      store.stopNavigation();
    }
  }, [store]);

  // Stop navigation and cleanup GPS subscription
  const stopNavigation = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      logger.info('navigation', 'GPS tracking stopped');
    }
    store.stopNavigation();
  }, [store]);

  // Pause/resume just update state (GPS keeps running for when resumed)
  const pauseNavigation = useCallback(() => {
    store.pauseNavigation();
  }, [store]);

  const resumeNavigation = useCallback(() => {
    store.resumeNavigation();
  }, [store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // Computed values
  const currentSpeedKmh = metersPerSecondToKmh(store.smoothedSpeed);
  const formattedSpeed = formatSpeed(store.smoothedSpeed);
  const formattedDistanceRemaining = formatDistance(store.distanceRemaining);
  const formattedDistanceTraveled = formatDistance(store.distanceTraveled);
  const estimatedTime = estimateTimeRemaining(store.distanceRemaining, store.smoothedSpeed);
  const formattedTimeRemaining = formatTime(estimatedTime);

  return {
    // State
    isNavigating: store.isNavigating,
    isPaused: store.isPaused,
    routeName: store.routeName,

    // Current metrics
    currentSpeedKmh,
    formattedSpeed,

    // Progress
    distanceTraveled: store.distanceTraveled,
    distanceRemaining: store.distanceRemaining,
    progressPercent: store.progressPercent,
    formattedDistanceRemaining,
    formattedDistanceTraveled,

    // Time
    estimatedTimeRemaining: estimatedTime,
    formattedTimeRemaining,

    // Route following
    isOffRoute: store.isOffRoute,
    distanceFromRoute: store.distanceFromRoute,

    // Error
    error: store.error,

    // Actions
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    stopNavigation,
    clearError: store.clearError,
  };
}
