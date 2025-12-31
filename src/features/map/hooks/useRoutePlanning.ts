import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useRoutingStore } from '../../routing/store/routingStore';
import { useSavedRoutesStore } from '../../routing/store/savedRoutesStore';
import { Coordinate, Waypoint } from '../../routing/types';
import { calculatePathDistance } from '../../routing/services/routing.service';
import { debounce } from '../../../shared/utils';

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

  // Drag state - which waypoint is currently being dragged
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);

  // Track previous waypoints for change detection
  const prevWaypointsRef = useRef<string>('');

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

  // Stable ref for calculateCurrentRoute to avoid debounce resets
  const calculateRouteRef = useRef(calculateCurrentRoute);
  useEffect(() => {
    calculateRouteRef.current = calculateCurrentRoute;
  }, [calculateCurrentRoute]);

  // Debounced route calculation - 300ms delay prevents excessive API calls during drag
  const debouncedCalculateRoute = useMemo(
    () => debounce(() => {
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

  // Auto-calculate route when waypoints are added/removed (not during drag)
  useEffect(() => {
    if (!isPlanning || mode !== 'point-to-point') return;

    // Create a simple hash of waypoints to detect real changes
    const waypointsHash = waypoints.map(w => `${w.id}:${w.order}`).join(',');
    const waypointsChanged = waypointsHash !== prevWaypointsRef.current;
    prevWaypointsRef.current = waypointsHash;

    // Calculate route when waypoints are added/removed (structure changes)
    if (waypoints.length >= 2 && waypointsChanged) {
      calculateCurrentRoute();
    }
  }, [isPlanning, waypoints, mode, calculateCurrentRoute]);

  // Generate GeoJSON for route display
  const routeGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (calculatedGeometry.length < 2) {
      return null;
    }
    return {
      type: 'Feature',
      properties: { type: 'planned-route' },
      geometry: {
        type: 'LineString',
        coordinates: calculatedGeometry.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [calculatedGeometry]);

  // Generate GeoJSON for waypoint display with CircleLayer
  const waypointsGeoJSON = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
    type: 'FeatureCollection',
    features: waypoints.map((wp) => ({
      type: 'Feature' as const,
      id: wp.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [wp.longitude, wp.latitude],
      },
      properties: {
        id: wp.id,
        order: wp.order + 1,
        type: wp.type,
        color: wp.type === 'start' ? '#22C55E' : wp.type === 'end' ? '#EF4444' : '#3B82F6',
      },
    })),
  }), [waypoints]);

  // Calculate route distance
  const routeDistance = useMemo(() => {
    if (calculatedGeometry.length < 2) return 0;
    return calculatePathDistance(calculatedGeometry);
  }, [calculatedGeometry]);

  // Get duration from current route if available
  const routeDuration = currentRoute?.duration ?? null;

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
    [editingRouteId, waypoints, calculatedGeometry, updateExistingRoute, prepareForSave, saveRoute, cancelPlanning]
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
