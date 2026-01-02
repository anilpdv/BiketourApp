import { create } from 'zustand';
import { POI, POICategory, POIFilterState, BoundingBox } from '../types';
import { poiRepository } from '../services/poi.repository';
import {
  fetchPOIsWithCache,
  fetchPOIsProgressively,
  fetchPOIsForViewport,
} from '../services/overpass.service';
import { logger, withTimeout, isTimeoutError } from '../../../shared/utils';

// Loading timeout to prevent forever loading (15 seconds)
const LOADING_TIMEOUT_MS = 15000;

interface POIState {
  // All loaded POIs
  pois: POI[];

  // POI IDs for O(1) deduplication lookup
  poiIds: Set<string>;

  // POIs grouped by category
  poisByCategory: Map<POICategory, POI[]>;

  // Selected POI for detail view
  selectedPOI: POI | null;

  // Filter state
  filters: POIFilterState;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Favorites state
  favoriteIds: Set<string>;
  favorites: POI[];
  favoritesLoading: boolean;

  // Actions
  setPOIs: (pois: POI[]) => void;
  addPOIs: (pois: POI[]) => void;
  clearPOIs: () => void;
  selectPOI: (poi: POI | null) => void;
  setFilters: (filters: Partial<POIFilterState>) => void;
  toggleCategory: (category: POICategory) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Favorites actions
  loadFavorites: () => Promise<void>;
  toggleFavorite: (poi: POI, note?: string) => Promise<void>;
  updateFavoriteNote: (poiId: string, note: string) => Promise<void>;
  isFavorite: (poiId: string) => boolean;

  // Cache-aware loading
  loadPOIsForBounds: (bbox: BoundingBox, categories?: POICategory[]) => Promise<void>;

  // Progressive loading (show cached immediately, fetch fresh in background)
  loadPOIsProgressively: (bbox: BoundingBox, categories?: POICategory[]) => Promise<void>;

  // Viewport-based loading (only fetch uncached tiles)
  loadPOIsForViewport: (
    bbox: BoundingBox,
    categories?: POICategory[],
    onProgress?: (loaded: number, total: number) => void
  ) => Promise<void>;
}

const defaultFilters: POIFilterState = {
  categories: [], // Start with no categories enabled - user selects what to show
  maxDistance: 20,
  showOnMap: true,
};

export const usePOIStore = create<POIState>((set, get) => ({
  pois: [],
  poiIds: new Set(),
  poisByCategory: new Map(),
  selectedPOI: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,
  favoriteIds: new Set(),
  favorites: [],
  favoritesLoading: false,

  setPOIs: (pois) => {
    const byCategory = new Map<POICategory, POI[]>();
    const ids = new Set<string>();
    for (const poi of pois) {
      ids.add(poi.id);
      const existing = byCategory.get(poi.category) || [];
      byCategory.set(poi.category, [...existing, poi]);
    }
    set({ pois, poiIds: ids, poisByCategory: byCategory });
  },

  // OPTIMIZED: Uses persistent Set for O(1) deduplication instead of O(n) array scan
  addPOIs: (newPOIs) => {
    const { pois, poiIds, poisByCategory } = get();

    // Filter using existing Set - O(1) per lookup instead of O(n)
    const uniqueNew = newPOIs.filter((p) => !poiIds.has(p.id));
    if (uniqueNew.length === 0) return; // Early exit if no new POIs

    // Add new IDs to Set
    for (const poi of uniqueNew) {
      poiIds.add(poi.id);
    }

    // Batch category updates - group by category first
    const newByCategory = new Map(poisByCategory);
    const categoryBatches = new Map<POICategory, POI[]>();

    for (const poi of uniqueNew) {
      const batch = categoryBatches.get(poi.category) || [];
      batch.push(poi);
      categoryBatches.set(poi.category, batch);
    }

    for (const [category, batch] of categoryBatches) {
      const existing = newByCategory.get(category) || [];
      newByCategory.set(category, [...existing, ...batch]);
    }

    set({
      pois: [...pois, ...uniqueNew],
      poiIds, // Mutated in place for performance
      poisByCategory: newByCategory,
    });
  },

  clearPOIs: () => {
    set({
      pois: [],
      poiIds: new Set(),
      poisByCategory: new Map(),
      selectedPOI: null,
    });
  },

  selectPOI: (poi) => set({ selectedPOI: poi }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  toggleCategory: (category) =>
    set((state) => {
      const categories = state.filters.categories.includes(category)
        ? state.filters.categories.filter((c) => c !== category)
        : [...state.filters.categories, category];
      return {
        filters: { ...state.filters, categories },
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Load favorites from database
  loadFavorites: async () => {
    set({ favoritesLoading: true });
    try {
      const favorites = await poiRepository.getFavorites();
      const favoriteIds = new Set(favorites.map((f) => f.id));
      set({ favorites, favoriteIds, favoritesLoading: false });
    } catch (error) {
      logger.error('store', 'Failed to load favorites', error);
      set({ favoritesLoading: false });
    }
  },

  // Toggle favorite status with optimistic update
  toggleFavorite: async (poi: POI, note?: string) => {
    const { favoriteIds, favorites } = get();
    const isFav = favoriteIds.has(poi.id);

    // Optimistic update
    const newFavoriteIds = new Set(favoriteIds);
    let newFavorites: POI[];

    if (isFav) {
      newFavoriteIds.delete(poi.id);
      newFavorites = favorites.filter((f) => f.id !== poi.id);
    } else {
      newFavoriteIds.add(poi.id);
      newFavorites = [...favorites, poi];
    }

    set({
      favoriteIds: newFavoriteIds,
      favorites: newFavorites,
    });

    // Persist to database
    try {
      if (isFav) {
        await poiRepository.removeFavorite(poi.id);
      } else {
        await poiRepository.addFavorite(poi.id, note);
      }
    } catch (error) {
      logger.error('store', 'Failed to toggle favorite', error);
      // Rollback on failure
      set({ favoriteIds, favorites });
    }
  },

  // Update favorite note
  updateFavoriteNote: async (poiId: string, note: string) => {
    try {
      await poiRepository.updateFavoriteNote(poiId, note);
    } catch (error) {
      logger.error('store', 'Failed to update favorite note', error);
    }
  },

  // Check if POI is favorite
  isFavorite: (poiId: string) => {
    return get().favoriteIds.has(poiId);
  },

  // Load POIs with cache-first strategy (with timeout)
  loadPOIsForBounds: async (bbox: BoundingBox, categories?: POICategory[]) => {
    set({ isLoading: true, error: null });
    try {
      const pois = await withTimeout(
        fetchPOIsWithCache(bbox, categories),
        LOADING_TIMEOUT_MS,
        'POI loading timed out'
      );
      get().addPOIs(pois);
      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = isTimeoutError(error)
        ? 'POI loading timed out. Try zooming in.'
        : 'Failed to load POIs';
      logger.error('store', errorMessage, error);
      set({ isLoading: false, error: errorMessage });
    }
  },

  // Progressive loading: show cached POIs immediately, fetch fresh in background (with timeout)
  loadPOIsProgressively: async (bbox: BoundingBox, categories?: POICategory[]) => {
    set({ isLoading: true, error: null });
    try {
      await withTimeout(
        fetchPOIsProgressively(
          bbox,
          (cachedPOIs) => {
            // Show cached data immediately
            get().addPOIs(cachedPOIs);
          },
          (freshPOIs) => {
            // Update with fresh data
            get().addPOIs(freshPOIs);
          },
          categories
        ),
        LOADING_TIMEOUT_MS,
        'POI loading timed out'
      );
      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = isTimeoutError(error)
        ? 'POI loading timed out. Try zooming in.'
        : 'Failed to load POIs';
      logger.error('store', errorMessage, error);
      set({ isLoading: false, error: errorMessage });
    }
  },

  // Viewport-based loading: only fetch uncached tiles (with timeout)
  loadPOIsForViewport: async (
    bbox: BoundingBox,
    categories?: POICategory[],
    onProgress?: (loaded: number, total: number) => void
  ) => {
    set({ isLoading: true, error: null });
    try {
      const pois = await withTimeout(
        fetchPOIsForViewport(bbox, categories, onProgress),
        LOADING_TIMEOUT_MS,
        'POI loading timed out'
      );
      get().addPOIs(pois);
      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = isTimeoutError(error)
        ? 'POI loading timed out. Try zooming in.'
        : 'Failed to load POIs';
      logger.error('store', errorMessage, error);
      set({ isLoading: false, error: errorMessage });
    }
  },
}));

// Selectors
export const selectFilteredPOIs = (state: POIState): POI[] => {
  const { pois, filters } = state;
  return pois.filter((poi) => filters.categories.includes(poi.category));
};

export const selectPOIsByCategory = (category: POICategory) => (state: POIState): POI[] => {
  return state.poisByCategory.get(category) || [];
};

export const selectNearestPOI = (
  category: POICategory,
  userLat: number,
  userLon: number
) => (state: POIState): POI | undefined => {
  const pois = state.poisByCategory.get(category) || [];
  if (pois.length === 0) return undefined;

  let nearest: POI | undefined;
  let minDistance = Infinity;

  for (const poi of pois) {
    const dist = poi.distanceFromUser ?? Infinity;
    if (dist < minDistance) {
      minDistance = dist;
      nearest = poi;
    }
  }

  return nearest;
};

/**
 * Select POIs within a viewport bounding box
 * Used for memory optimization - only render POIs visible on screen
 */
export const selectPOIsInViewport = (bbox: BoundingBox) => (state: POIState): POI[] => {
  const { pois, filters } = state;
  return pois.filter(
    (poi) =>
      filters.categories.includes(poi.category) &&
      poi.latitude >= bbox.south &&
      poi.latitude <= bbox.north &&
      poi.longitude >= bbox.west &&
      poi.longitude <= bbox.east
  );
};

/**
 * Select POI count by category (for filter badges)
 */
export const selectPOICountByCategory = (state: POIState): Map<POICategory, number> => {
  const counts = new Map<POICategory, number>();
  for (const [category, pois] of state.poisByCategory) {
    counts.set(category, pois.length);
  }
  return counts;
};
