import { create } from 'zustand';
import {
  RoutePlanningMode,
  Waypoint,
  Coordinate,
  CustomRoute,
  RoutingState,
} from '../types';
import { calculateRoute } from '../services/routing.service';
import { logger } from '../../../shared/utils';
import {
  createHistoryEntry,
  pushToHistory,
  assignWaypointTypes,
  convertEndToVia,
  restoreFromHistory,
} from '../utils/historyUtils';

interface RoutingStore extends RoutingState {
  // Planning actions
  startPlanning: (mode: RoutePlanningMode) => void;
  cancelPlanning: () => void;
  loadSavedRoute: (route: CustomRoute) => void;

  // Waypoint actions
  addWaypoint: (coordinate: Coordinate, name?: string) => void;
  removeWaypoint: (id: string) => void;
  moveWaypoint: (id: string, newCoordinate: Coordinate) => void;
  finishMoveWaypoint: () => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  clearWaypoints: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Route calculation
  calculateCurrentRoute: () => Promise<void>;
  setGeometry: (geometry: Coordinate[]) => void;

  // Saving
  prepareForSave: (name: string, description?: string) => CustomRoute;

  // Error handling
  clearError: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useRoutingStore = create<RoutingStore>((set, get) => ({
  // Initial state
  mode: null,
  isPlanning: false,
  currentRoute: null,
  waypoints: [],
  calculatedGeometry: [],
  history: [],
  historyIndex: -1,
  isCalculating: false,
  error: null,
  editingRouteId: null,
  editingRouteName: null,
  editingRouteDescription: null,

  startPlanning: (mode) => {
    set({
      mode,
      isPlanning: true,
      currentRoute: { mode },
      waypoints: [],
      calculatedGeometry: [],
      history: [],
      historyIndex: -1,
      error: null,
      editingRouteId: null,
      editingRouteName: null,
      editingRouteDescription: null,
    });
  },

  cancelPlanning: () => {
    set({
      mode: null,
      isPlanning: false,
      currentRoute: null,
      waypoints: [],
      calculatedGeometry: [],
      history: [],
      historyIndex: -1,
      error: null,
      editingRouteId: null,
      editingRouteName: null,
      editingRouteDescription: null,
    });
  },

  loadSavedRoute: (route) => {
    set({
      mode: route.mode,
      isPlanning: true,
      currentRoute: {
        mode: route.mode,
        distance: route.distance,
        duration: route.duration,
      },
      waypoints: route.waypoints,
      calculatedGeometry: route.geometry,
      history: [createHistoryEntry(route.waypoints, route.geometry)],
      historyIndex: 0,
      error: null,
      editingRouteId: route.id,
      editingRouteName: route.name,
      editingRouteDescription: route.description || null,
    });
  },

  addWaypoint: (coordinate, name) => {
    const { waypoints, calculatedGeometry, history, historyIndex } = get();

    // Determine waypoint type
    const type = waypoints.length === 0 ? 'start' : 'end';

    // If adding a new endpoint, convert previous endpoint to via
    const updatedWaypoints = convertEndToVia(waypoints);

    const newWaypoint: Waypoint = {
      id: generateId(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name,
      type,
      order: updatedWaypoints.length,
    };

    const newWaypoints = [...updatedWaypoints, newWaypoint];

    // Save to history
    const historyUpdate = pushToHistory(
      history,
      historyIndex,
      createHistoryEntry(newWaypoints, calculatedGeometry)
    );

    set({
      waypoints: newWaypoints,
      ...historyUpdate,
    });
  },

  removeWaypoint: (id) => {
    const { waypoints, calculatedGeometry, history, historyIndex } = get();

    const filtered = waypoints.filter((wp) => wp.id !== id);
    const updatedWaypoints = assignWaypointTypes(filtered);

    // Save to history
    const historyUpdate = pushToHistory(
      history,
      historyIndex,
      createHistoryEntry(updatedWaypoints, calculatedGeometry)
    );

    set({
      waypoints: updatedWaypoints,
      ...historyUpdate,
    });
  },

  // Called during drag - no history save (prevents bloat)
  moveWaypoint: (id, newCoordinate) => {
    const { waypoints } = get();

    const updatedWaypoints = waypoints.map((wp) =>
      wp.id === id
        ? { ...wp, latitude: newCoordinate.latitude, longitude: newCoordinate.longitude }
        : wp
    );

    set({ waypoints: updatedWaypoints });
  },

  // Called at drag END - saves to history
  finishMoveWaypoint: () => {
    const { waypoints, calculatedGeometry, history, historyIndex } = get();

    const historyUpdate = pushToHistory(
      history,
      historyIndex,
      createHistoryEntry(waypoints, calculatedGeometry)
    );

    set(historyUpdate);
  },

  reorderWaypoints: (fromIndex, toIndex) => {
    const { waypoints, calculatedGeometry, history, historyIndex } = get();

    const reordered = [...waypoints];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);

    // Re-assign types and order
    const updatedWaypoints = assignWaypointTypes(reordered);

    // Save to history
    const historyUpdate = pushToHistory(
      history,
      historyIndex,
      createHistoryEntry(updatedWaypoints, calculatedGeometry)
    );

    set({
      waypoints: updatedWaypoints,
      ...historyUpdate,
    });
  },

  clearWaypoints: () => {
    const { history, historyIndex } = get();

    const historyUpdate = pushToHistory(
      history,
      historyIndex,
      createHistoryEntry([], [])
    );

    set({
      waypoints: [],
      calculatedGeometry: [],
      ...historyUpdate,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const { waypoints, geometry } = restoreFromHistory(history[newIndex]);

    set({
      waypoints,
      calculatedGeometry: geometry,
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const { waypoints, geometry } = restoreFromHistory(history[newIndex]);

    set({
      waypoints,
      calculatedGeometry: geometry,
      historyIndex: newIndex,
    });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  calculateCurrentRoute: async () => {
    const { waypoints, mode, currentRoute } = get();

    if (waypoints.length < 2) {
      set({ calculatedGeometry: [], error: null });
      return;
    }

    set({ isCalculating: true, error: null });

    try {
      if (mode === 'freeform') {
        // For freeform, just connect the dots
        const geometry = waypoints.map((wp) => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
        }));
        set({ calculatedGeometry: geometry, isCalculating: false });
      } else {
        // For point-to-point, use Mapbox cycling routing
        const coordinates = waypoints.map((wp) => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
        }));

        const result = await calculateRoute(coordinates, {
          profile: 'cycling',
          provider: 'mapbox',
        });

        // Store route with distance and duration
        set({
          calculatedGeometry: result.geometry,
          isCalculating: false,
          currentRoute: {
            ...currentRoute,
            distance: result.distance,
            duration: result.duration,
          },
        });
      }
    } catch (error) {
      logger.error('store', 'Route calculation failed', error);
      set({
        error: 'Failed to calculate cycling route. Please try again.',
        isCalculating: false,
      });
    }
  },

  setGeometry: (geometry) => {
    set({ calculatedGeometry: geometry });
  },

  prepareForSave: (name, description) => {
    const { waypoints, calculatedGeometry, mode } = get();

    const now = new Date().toISOString();

    // Calculate total distance
    let distance = 0;
    for (let i = 1; i < calculatedGeometry.length; i++) {
      const prev = calculatedGeometry[i - 1];
      const curr = calculatedGeometry[i];
      const R = 6371000;
      const dLat = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const dLon = ((curr.longitude - prev.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.latitude * Math.PI) / 180) *
          Math.cos((curr.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance += R * c;
    }

    return {
      id: generateId(),
      name,
      description,
      mode: mode || 'point-to-point',
      waypoints: JSON.parse(JSON.stringify(waypoints)),
      geometry: JSON.parse(JSON.stringify(calculatedGeometry)),
      distance,
      createdAt: now,
      updatedAt: now,
    };
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectIsPlanning = (state: RoutingStore): boolean =>
  state.isPlanning;

export const selectHasWaypoints = (state: RoutingStore): boolean =>
  state.waypoints.length > 0;

export const selectCanCalculate = (state: RoutingStore): boolean =>
  state.waypoints.length >= 2;
