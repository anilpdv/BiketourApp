/**
 * Route Drag Hook
 * Handles drag-to-modify route line interactions
 * Allows users to drag anywhere on the route line to add via waypoints
 */

import { useCallback, useState } from 'react';
import { Coordinate, Waypoint } from '../../routing/types';
import {
  findRouteSegmentForInsertion,
  isWithinRouteThreshold,
} from '../../routing/utils/routeSegmentUtils';
import { useRoutingStore } from '../../routing/store/routingStore';

export interface RouteLinePressEvent {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties?: Record<string, unknown>;
}

export interface UseRouteDragReturn {
  /** Whether a route drag preview is active */
  isDraggingRoute: boolean;
  /** Coordinate where the user pressed on the route (for preview marker) */
  dragPreviewCoordinate: Coordinate | null;
  /** Segment index where the via point will be inserted */
  dragInsertIndex: number | null;
  /** Handle route line press - shows preview and prepares insertion */
  handleRouteLinePress: (event: RouteLinePressEvent) => void;
  /** Confirm the drag and insert the via waypoint */
  confirmRouteDrag: () => void;
  /** Cancel the drag preview */
  cancelRouteDrag: () => void;
}

/**
 * Hook for managing drag-to-modify route line interactions
 *
 * Usage:
 * 1. Add onPress to the route ShapeSource
 * 2. When user presses route line, handleRouteLinePress is called
 * 3. Shows a preview marker at the pressed location
 * 4. User can confirm (creates via waypoint) or cancel
 */
export function useRouteDrag(): UseRouteDragReturn {
  const [isDraggingRoute, setIsDraggingRoute] = useState(false);
  const [dragPreviewCoordinate, setDragPreviewCoordinate] = useState<Coordinate | null>(null);
  const [dragInsertIndex, setDragInsertIndex] = useState<number | null>(null);

  // Get store state and actions
  const waypoints = useRoutingStore((state) => state.waypoints);
  const calculatedGeometry = useRoutingStore((state) => state.calculatedGeometry);
  const insertViaWaypoint = useRoutingStore((state) => state.insertViaWaypoint);

  /**
   * Handle route line press event from MapLibre ShapeSource
   */
  const handleRouteLinePress = useCallback(
    (event: RouteLinePressEvent) => {
      // Need at least 2 waypoints to insert between
      if (waypoints.length < 2 || calculatedGeometry.length < 2) {
        return;
      }

      // Extract coordinates from the event
      const [longitude, latitude] = event.geometry.coordinates;
      const pressedCoord: Coordinate = { latitude, longitude };

      // Find which segment was clicked and get insertion info
      const segmentInfo = findRouteSegmentForInsertion(
        pressedCoord,
        waypoints,
        calculatedGeometry
      );

      if (!segmentInfo) {
        return;
      }

      // Check if the press is close enough to the route (within threshold)
      if (!isWithinRouteThreshold(segmentInfo.distanceToRoute, 100)) {
        // 100m threshold for touch accuracy
        return;
      }

      // Set preview state - use the nearest point on route for better accuracy
      setDragPreviewCoordinate(segmentInfo.nearestCoordinate);
      setDragInsertIndex(segmentInfo.insertAtIndex);
      setIsDraggingRoute(true);
    },
    [waypoints, calculatedGeometry]
  );

  /**
   * Confirm the drag and insert the via waypoint
   */
  const confirmRouteDrag = useCallback(() => {
    if (dragPreviewCoordinate && dragInsertIndex !== null) {
      insertViaWaypoint(dragPreviewCoordinate, dragInsertIndex);
    }

    // Reset state
    setIsDraggingRoute(false);
    setDragPreviewCoordinate(null);
    setDragInsertIndex(null);
  }, [dragPreviewCoordinate, dragInsertIndex, insertViaWaypoint]);

  /**
   * Cancel the drag preview
   */
  const cancelRouteDrag = useCallback(() => {
    setIsDraggingRoute(false);
    setDragPreviewCoordinate(null);
    setDragInsertIndex(null);
  }, []);

  return {
    isDraggingRoute,
    dragPreviewCoordinate,
    dragInsertIndex,
    handleRouteLinePress,
    confirmRouteDrag,
    cancelRouteDrag,
  };
}
