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

  // Stable refs to avoid callback recreations
  const calculateRouteRef = useRef(calculateCurrentRoute);
  calculateRouteRef.current = calculateCurrentRoute;

  const waypointCountRef = useRef(waypoints.length);
  waypointCountRef.current = waypoints.length;

  // Debounced route calculation - 500ms delay for better performance during active drag
  const debouncedCalculateRoute = useMemo(() => {
    const debouncedFn = debounce(() => {
      if (waypointCountRef.current >= 2) {
        calculateRouteRef.current();
      }
    }, 500);
    return debouncedFn;
  }, []);

  // Handle waypoint press - select for dragging
  const handleWaypointPress = useCallback((waypointId: string) => {
    setDraggingWaypointId(waypointId);
  }, []);

  // Handle waypoint drag - move position + debounced recalc
  const handleWaypointDrag = useCallback(
    (waypointId: string, newCoordinate: Coordinate) => {
      moveWaypoint(waypointId, newCoordinate);
      // Recalculate route with debounce to avoid excessive API calls
      debouncedCalculateRoute();
    },
    [moveWaypoint, debouncedCalculateRoute]
  );

  // Handle waypoint drag end - save to history and clear drag state
  const handleWaypointDragEnd = useCallback(() => {
    // Cancel any pending debounced calculation
    debouncedCalculateRoute.cancel();
    finishMoveWaypoint();
    setDraggingWaypointId(null);
    // Force immediate final calculation
    if (waypointCountRef.current >= 2) {
      calculateRouteRef.current();
    }
  }, [finishMoveWaypoint, debouncedCalculateRoute]);

  return {
    draggingWaypointId,
    handleWaypointPress,
    handleWaypointDrag,
    handleWaypointDragEnd,
  };
}
