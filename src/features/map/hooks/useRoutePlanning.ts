import { useCallback, useEffect, useRef } from 'react';
import { useRoutingStore } from '../../routing/store/routingStore';
import { useSavedRoutesStore } from '../../routing/store/savedRoutesStore';
import { Coordinate, Waypoint } from '../../routing/types';
import { useWaypointManagement } from './useWaypointManagement';
import { useRouteGeometry } from './useRouteGeometry';

export interface UseRoutePlanningReturn {
  // State
  isPlanning: boolean;
  mode: string | null;
  waypoints: Waypoint[];
  calculatedGeometry: Coordinate[];
  isCalculating: boolean;
  error: string | null;
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null;
  waypointsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point>;
  routeDistance: number;
  routeDuration: number | null;
  draggingWaypointId: string | null;
  editingRouteId: string | null;
  editingRouteName: string | null;
  editingRouteDescription: string | null;

  // Actions
  startRoutePlanning: () => void;
  cancelPlanning: () => void;
  handleMapPress: (coordinate: Coordinate) => void;
  handleWaypointPress: (waypointId: string) => void;
  handleWaypointDrag: (waypointId: string, newCoordinate: Coordinate) => void;
  handleWaypointDragEnd: () => void;
  removeWaypoint: (id: string) => void;
  clearWaypoints: () => void;
  handleSaveRoute: (name: string, description?: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearError: () => void;
}

/**
 * Hook for managing route planning state and actions in the map screen
 * Composes useWaypointManagement and useRouteGeometry hooks
 */
export function useRoutePlanning(): UseRoutePlanningReturn {
  const {
    isPlanning,
    mode,
    waypoints,
    calculatedGeometry,
    isCalculating,
    error,
    currentRoute,
    editingRouteId,
    editingRouteName,
    editingRouteDescription,
    startPlanning,
    cancelPlanning,
    addWaypoint,
    removeWaypoint,
    moveWaypoint,
    finishMoveWaypoint,
    clearWaypoints,
    calculateCurrentRoute,
    prepareForSave,
    undo,
    redo,
    canUndo,
    canRedo,
    clearError,
  } = useRoutingStore();

  const { saveRoute, updateExistingRoute } = useSavedRoutesStore();

  // Track previous waypoints for change detection
  const prevWaypointsRef = useRef<string>('');

  // Compose waypoint management hook
  const {
    draggingWaypointId,
    handleWaypointPress,
    handleWaypointDrag,
    handleWaypointDragEnd,
  } = useWaypointManagement({
    waypoints,
    moveWaypoint,
    finishMoveWaypoint,
    calculateCurrentRoute,
  });

  // Compose route geometry hook
  const { routeGeoJSON, waypointsGeoJSON, routeDistance, routeDuration } =
    useRouteGeometry(calculatedGeometry, waypoints, currentRoute);

  // Start route planning in point-to-point mode
  const startRoutePlanning = useCallback(() => {
    startPlanning('point-to-point');
  }, [startPlanning]);

  // Handle map press to add waypoint
  const handleMapPress = useCallback(
    (coordinate: Coordinate) => {
      if (!isPlanning) return;
      addWaypoint(coordinate);
    },
    [isPlanning, addWaypoint]
  );

  // Auto-calculate route when waypoints are added/removed (not during drag)
  useEffect(() => {
    if (!isPlanning || mode !== 'point-to-point') return;

    // Create a simple hash of waypoints to detect real changes
    const waypointsHash = waypoints.map((w) => `${w.id}:${w.order}`).join(',');
    const waypointsChanged = waypointsHash !== prevWaypointsRef.current;
    prevWaypointsRef.current = waypointsHash;

    // Calculate route when waypoints are added/removed (structure changes)
    if (waypoints.length >= 2 && waypointsChanged) {
      calculateCurrentRoute();
    }
  }, [isPlanning, waypoints, mode, calculateCurrentRoute]);

  // Save route handler - update existing or create new
  const handleSaveRoute = useCallback(
    async (name: string, description?: string) => {
      if (editingRouteId) {
        // Update existing route with new waypoints and geometry
        await updateExistingRoute(editingRouteId, waypoints, calculatedGeometry);
      } else {
        // Create new route
        const route = prepareForSave(name, description);
        await saveRoute(route);
      }
      cancelPlanning();
    },
    [
      editingRouteId,
      waypoints,
      calculatedGeometry,
      updateExistingRoute,
      prepareForSave,
      saveRoute,
      cancelPlanning,
    ]
  );

  return {
    // State
    isPlanning,
    mode,
    waypoints,
    calculatedGeometry,
    isCalculating,
    error,
    routeGeoJSON,
    waypointsGeoJSON,
    routeDistance,
    routeDuration,
    draggingWaypointId,
    editingRouteId,
    editingRouteName,
    editingRouteDescription,

    // Actions
    startRoutePlanning,
    cancelPlanning,
    handleMapPress,
    handleWaypointPress,
    handleWaypointDrag,
    handleWaypointDragEnd,
    removeWaypoint,
    clearWaypoints,
    handleSaveRoute,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    clearError,
  };
}
