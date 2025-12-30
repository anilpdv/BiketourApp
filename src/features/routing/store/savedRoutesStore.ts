import { create } from 'zustand';
import { CustomRoute, CustomRouteSummary } from '../types';
import { routeRepository } from '../services/route.repository';
import { exportAndShare } from '../services/gpx.export.service';
import { pickAndImportGPX } from '../services/gpx.import.service';
import { logger } from '../../../shared/utils';

interface SavedRoutesState {
  routes: CustomRouteSummary[];
  selectedRouteId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface SavedRoutesStore extends SavedRoutesState {
  // Actions
  loadRoutes: () => Promise<void>;
  selectRoute: (id: string | null) => void;
  saveRoute: (route: CustomRoute) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  duplicateRoute: (id: string, newName: string) => Promise<CustomRoute | null>;
  exportRoute: (id: string) => Promise<boolean>;
  importRoute: () => Promise<CustomRoute | null>;
  clearError: () => void;
}

export const useSavedRoutesStore = create<SavedRoutesStore>((set, get) => ({
  routes: [],
  selectedRouteId: null,
  isLoading: false,
  error: null,

  loadRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const routes = await routeRepository.getAllRoutes();
      set({ routes, isLoading: false });
    } catch (error) {
      logger.error('store', 'Failed to load routes', error);
      set({
        error: 'Failed to load saved routes',
        isLoading: false,
      });
    }
  },

  selectRoute: (id) => {
    set({ selectedRouteId: id });
  },

  saveRoute: async (route) => {
    set({ isLoading: true, error: null });
    try {
      await routeRepository.saveRoute(route);
      // Reload routes to get updated list
      const routes = await routeRepository.getAllRoutes();
      set({ routes, isLoading: false });
    } catch (error) {
      logger.error('store', 'Failed to save route', error);
      set({
        error: 'Failed to save route',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRoute: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await routeRepository.deleteRoute(id);
      const { routes, selectedRouteId } = get();
      set({
        routes: routes.filter((r) => r.id !== id),
        selectedRouteId: selectedRouteId === id ? null : selectedRouteId,
        isLoading: false,
      });
    } catch (error) {
      logger.error('store', 'Failed to delete route', error);
      set({
        error: 'Failed to delete route',
        isLoading: false,
      });
    }
  },

  duplicateRoute: async (id, newName) => {
    set({ isLoading: true, error: null });
    try {
      const duplicated = await routeRepository.duplicateRoute(id, newName);
      const routes = await routeRepository.getAllRoutes();
      set({ routes, isLoading: false });
      return duplicated;
    } catch (error) {
      logger.error('store', 'Failed to duplicate route', error);
      set({
        error: 'Failed to duplicate route',
        isLoading: false,
      });
      return null;
    }
  },

  exportRoute: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const route = await routeRepository.getRouteById(id);
      if (!route) {
        throw new Error('Route not found');
      }
      const success = await exportAndShare(route);
      set({ isLoading: false });
      return success;
    } catch (error) {
      logger.error('store', 'Failed to export route', error);
      set({
        error: 'Failed to export route',
        isLoading: false,
      });
      return false;
    }
  },

  importRoute: async () => {
    set({ isLoading: true, error: null });
    try {
      const route = await pickAndImportGPX();
      if (route) {
        await routeRepository.saveRoute(route);
        const routes = await routeRepository.getAllRoutes();
        set({ routes, isLoading: false });
        return route;
      }
      set({ isLoading: false });
      return null;
    } catch (error) {
      logger.error('store', 'Failed to import route', error);
      set({
        error: 'Failed to import route',
        isLoading: false,
      });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectRouteCount = (state: SavedRoutesStore): number =>
  state.routes.length;

export const selectHasRoutes = (state: SavedRoutesStore): boolean =>
  state.routes.length > 0;
