/**
 * Navigation Container
 * Manages active navigation overlay and start button
 */

import React, { useCallback } from 'react';
import { useActiveNavigation, NavigationOverlay, NavigationStartButton } from '../../../navigation';
import { Coordinate, Waypoint } from '../../../routing/types';

interface NavigationContainerProps {
  isPlanning: boolean;
  editingRouteId: string | null;
  editingRouteName: string | null;
  editingRouteDescription: string | null;
  waypoints: Waypoint[];
  calculatedGeometry: Coordinate[];
  routeDistance: number;
}

export function NavigationContainer({
  isPlanning,
  editingRouteId,
  editingRouteName,
  editingRouteDescription,
  waypoints,
  calculatedGeometry,
  routeDistance,
}: NavigationContainerProps) {
  const navigation = useActiveNavigation();

  const handleStartNavigation = useCallback(async () => {
    if (!editingRouteId || calculatedGeometry.length < 2) return;

    const routeForNavigation = {
      id: editingRouteId,
      name: editingRouteName || 'My Route',
      description: editingRouteDescription || undefined,
      mode: 'point-to-point' as const,
      waypoints: waypoints,
      geometry: calculatedGeometry,
      distance: routeDistance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await navigation.startNavigation(routeForNavigation);
  }, [editingRouteId, editingRouteName, editingRouteDescription, waypoints, calculatedGeometry, routeDistance, navigation]);

  return (
    <>
      {/* Active Navigation Overlay */}
      {navigation.isNavigating && (
        <NavigationOverlay
          routeName={navigation.routeName}
          formattedSpeed={navigation.formattedSpeed}
          currentSpeedKmh={navigation.currentSpeedKmh}
          formattedDistanceRemaining={navigation.formattedDistanceRemaining}
          formattedDistanceTraveled={navigation.formattedDistanceTraveled}
          progressPercent={navigation.progressPercent}
          formattedTimeRemaining={navigation.formattedTimeRemaining}
          isOffRoute={navigation.isOffRoute}
          isPaused={navigation.isPaused}
          onPause={navigation.pauseNavigation}
          onResume={navigation.resumeNavigation}
          onStop={navigation.stopNavigation}
        />
      )}

      {/* Navigation Start Button - show when route loaded but not navigating */}
      {isPlanning && editingRouteId && calculatedGeometry.length >= 2 && !navigation.isNavigating && (
        <NavigationStartButton
          onPress={handleStartNavigation}
          routeName={editingRouteName || undefined}
        />
      )}
    </>
  );
}

// Export navigation state for parent component coordination
export function useNavigationState() {
  const navigation = useActiveNavigation();
  return {
    isNavigating: navigation.isNavigating,
  };
}
