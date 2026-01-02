/**
 * Waypoint Management Hook
 * Handles waypoint drag/drop interactions with debounced route recalculation
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Coordinate, Waypoint } from '../../routing/types';
import { debounce } from '../../../shared/utils';

export interface UseWaypointManagementOptions {
  waypoints: Waypoint[];
  moveWaypoint: (id: string, newCoordinate: Coordinate) => void;
  finishMoveWaypoint: () => void;
  calculateCurrentRoute: () => void;
}

export interface UseWaypointManagementReturn {
  draggingWaypointId: string | null;
  handleWaypointPress: (waypointId: string) => void;
  handleWaypointDrag: (waypointId: string, newCoordinate: Coordinate) => void;
  handleWaypointDragEnd: () => void;
}

/**
 * Hook for managing waypoint drag/drop interactions
 * Uses debounced route calculation to prevent excessive API calls during drag
 */
export function useWaypointManagement(
  options: UseWaypointManagementOptions
): UseWaypointManagementReturn {
  const { waypoints, moveWaypoint, finishMoveWaypoint, calculateCurrentRoute } = options;

  // Drag state - which waypoint is currently being dragged
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);

  // Stable ref for calculateCurrentRoute to avoid debounce resets
  const calculateRouteRef = useRef(calculateCurrentRoute);
  calculateRouteRef.current = calculateCurrentRoute;

  // Debounced route calculation - 300ms delay prevents excessive API calls during drag
  const debouncedCalculateRoute = useMemo(
    () =>
      debounce(() => {
        calculateRouteRef.current();
      }, 300),
    []
  );

  // Handle waypoint press - select for dragging
  const handleWaypointPress = useCallback((waypointId: string) => {
    setDraggingWaypointId(waypointId);
  }, []);

  // Handle waypoint drag - move position + debounced recalc
  const handleWaypointDrag = useCallback(
    (waypointId: string, newCoordinate: Coordinate) => {
      moveWaypoint(waypointId, newCoordinate);
      // Recalculate route with debounce to avoid excessive API calls
      if (waypoints.length >= 2) {
        debouncedCalculateRoute();
      }
    },
    [moveWaypoint, waypoints.length, debouncedCalculateRoute]
  );

  // Handle waypoint drag end - save to history and clear drag state
  const handleWaypointDragEnd = useCallback(() => {
    finishMoveWaypoint();
    setDraggingWaypointId(null);
    // Force final calculation
    if (waypoints.length >= 2) {
      calculateCurrentRoute();
    }
  }, [finishMoveWaypoint, waypoints.length, calculateCurrentRoute]);

  return {
    draggingWaypointId,
    handleWaypointPress,
    handleWaypointDrag,
    handleWaypointDragEnd,
  };
}
