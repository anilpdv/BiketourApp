import { create } from 'zustand';
import { EuroVeloRoute, ParsedRoute } from '../types';

interface RouteState {
  // Route configurations from content.config.json
  routes: EuroVeloRoute[];

  // Parsed routes with coordinates
  parsedRoutes: Map<string, ParsedRoute>;

  // Currently selected route for display
  selectedRouteId: string | null;

  // Routes visible on map
  visibleRouteIds: string[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setRoutes: (routes: EuroVeloRoute[]) => void;
  addParsedRoute: (route: ParsedRoute) => void;
  selectRoute: (routeId: string | null) => void;
  toggleRouteVisibility: (routeId: string) => void;
  setVisibleRoutes: (routeIds: string[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  parsedRoutes: new Map(),
  selectedRouteId: null,
  visibleRouteIds: [],
  isLoading: false,
  error: null,

  setRoutes: (routes) => set({ routes }),

  addParsedRoute: (route) =>
    set((state) => {
      const newMap = new Map(state.parsedRoutes);
      newMap.set(route.id, route);
      return { parsedRoutes: newMap };
    }),

  selectRoute: (routeId) => set({ selectedRouteId: routeId }),

  toggleRouteVisibility: (routeId) =>
    set((state) => {
      const visible = state.visibleRouteIds.includes(routeId);
      return {
        visibleRouteIds: visible
          ? state.visibleRouteIds.filter((id) => id !== routeId)
          : [...state.visibleRouteIds, routeId],
      };
    }),

  setVisibleRoutes: (routeIds) => set({ visibleRouteIds: routeIds }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

// Selectors
export const selectRoute = (routeId: string) => (state: RouteState) =>
  state.routes.find((r) => r.id === routeId);

export const selectParsedRoute = (routeId: string) => (state: RouteState) =>
  state.parsedRoutes.get(routeId);

export const selectVisibleParsedRoutes = (state: RouteState) =>
  state.visibleRouteIds
    .map((id) => state.parsedRoutes.get(id))
    .filter((r): r is ParsedRoute => r !== undefined);

export const selectSelectedRoute = (state: RouteState) =>
  state.selectedRouteId
    ? state.parsedRoutes.get(state.selectedRouteId)
    : undefined;
