import { create } from 'zustand';
import { POICategory, POIFilterStateExtended, QuickFilter } from '../types';

/**
 * Default camping categories for a camping-focused app
 * These are shown by default when the app starts
 */
const DEFAULT_CAMPING_CATEGORIES: POICategory[] = [
  'campsite',
  'motorhome_spot',
  'wild_camping',
  'service_area',
];

/**
 * Default filter values
 */
const defaultFilters: POIFilterStateExtended = {
  categories: DEFAULT_CAMPING_CATEGORIES,
  maxDistance: 20,
  showOnMap: true,
  maxPrice: null,
  minRating: null,
  hasElectricity: null,
  hasWifi: null,
  isPetFriendly: null,
  isOpenNow: null,
};

interface FilterStoreState {
  // Current active filters
  filters: POIFilterStateExtended;

  // UI state for filters modal
  isModalVisible: boolean;

  // Temporary filters while modal is open (before apply)
  tempFilters: POIFilterStateExtended | null;

  // Actions for categories
  setCategories: (categories: POICategory[]) => void;
  toggleCategory: (category: POICategory) => void;
  clearCategories: () => void;

  // Actions for extended filters
  setMaxPrice: (price: number | null) => void;
  setMinRating: (rating: number | null) => void;
  setMaxDistance: (distance: number) => void;
  setToggleFilter: (
    key: 'hasElectricity' | 'hasWifi' | 'isPetFriendly' | 'isOpenNow',
    value: boolean | null
  ) => void;

  // Modal actions
  openModal: () => void;
  closeModal: () => void;
  applyFilters: (newFilters?: POIFilterStateExtended) => void;
  discardTempFilters: () => void;

  // Temp filters actions (used while modal is open)
  setTempCategories: (categories: POICategory[]) => void;
  toggleTempCategory: (category: POICategory) => void;
  setTempMaxPrice: (price: number | null) => void;
  setTempMinRating: (rating: number | null) => void;
  setTempToggleFilter: (
    key: 'hasElectricity' | 'hasWifi' | 'isPetFriendly' | 'isOpenNow',
    value: boolean | null
  ) => void;

  // Clear all filters
  clearAllFilters: () => void;
  clearTempFilters: () => void;

  // Computed values
  getActiveFilterCount: () => number;
  getQuickFilters: () => QuickFilter[];
}

export const useFilterStore = create<FilterStoreState>((set, get) => ({
  filters: defaultFilters,
  isModalVisible: false,
  tempFilters: null,

  // Category actions
  setCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),

  toggleCategory: (category) =>
    set((state) => {
      const currentCategories = state.filters.categories;
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      return { filters: { ...state.filters, categories: newCategories } };
    }),

  clearCategories: () =>
    set((state) => ({
      filters: { ...state.filters, categories: [] },
    })),

  // Extended filter actions
  setMaxPrice: (maxPrice) =>
    set((state) => ({
      filters: { ...state.filters, maxPrice },
    })),

  setMinRating: (minRating) =>
    set((state) => ({
      filters: { ...state.filters, minRating },
    })),

  setMaxDistance: (maxDistance) =>
    set((state) => ({
      filters: { ...state.filters, maxDistance },
    })),

  setToggleFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  // Modal actions
  openModal: () =>
    set((state) => ({
      isModalVisible: true,
      tempFilters: { ...state.filters },
    })),

  closeModal: () =>
    set({
      isModalVisible: false,
      tempFilters: null,
    }),

  applyFilters: (newFilters) =>
    set((state) => ({
      filters: newFilters ?? state.tempFilters ?? state.filters,
      isModalVisible: false,
      tempFilters: null,
    })),

  discardTempFilters: () =>
    set({
      isModalVisible: false,
      tempFilters: null,
    }),

  // Temp filter actions (for modal preview)
  setTempCategories: (categories) =>
    set((state) => ({
      tempFilters: state.tempFilters
        ? { ...state.tempFilters, categories }
        : null,
    })),

  toggleTempCategory: (category) =>
    set((state) => {
      if (!state.tempFilters) return state;
      const currentCategories = state.tempFilters.categories;
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      return { tempFilters: { ...state.tempFilters, categories: newCategories } };
    }),

  setTempMaxPrice: (maxPrice) =>
    set((state) => ({
      tempFilters: state.tempFilters
        ? { ...state.tempFilters, maxPrice }
        : null,
    })),

  setTempMinRating: (minRating) =>
    set((state) => ({
      tempFilters: state.tempFilters
        ? { ...state.tempFilters, minRating }
        : null,
    })),

  setTempToggleFilter: (key, value) =>
    set((state) => ({
      tempFilters: state.tempFilters
        ? { ...state.tempFilters, [key]: value }
        : null,
    })),

  // Clear actions
  clearAllFilters: () =>
    set({
      filters: defaultFilters,
    }),

  clearTempFilters: () =>
    set((state) => ({
      tempFilters: state.tempFilters ? { ...defaultFilters } : null,
    })),

  // Computed values
  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;

    if (filters.categories.length > 0) count += 1;
    if (filters.maxPrice !== null) count += 1;
    if (filters.minRating !== null) count += 1;
    if (filters.hasElectricity !== null) count += 1;
    if (filters.hasWifi !== null) count += 1;
    if (filters.isPetFriendly !== null) count += 1;
    if (filters.isOpenNow !== null) count += 1;

    return count;
  },

  getQuickFilters: () => {
    const { filters } = get();
    const quickFilters: QuickFilter[] = [];

    // Max price quick filter
    if (filters.maxPrice !== null) {
      quickFilters.push({
        id: 'maxPrice',
        label: `Max €${filters.maxPrice}`,
        isActive: true,
      });
    }

    // Rating quick filter
    if (filters.minRating !== null) {
      quickFilters.push({
        id: 'minRating',
        label: `${filters.minRating}+`,
        isActive: true,
        icon: 'star',
      });
    }

    // Category quick filters (show first 2 selected)
    filters.categories.slice(0, 2).forEach((category) => {
      quickFilters.push({
        id: `category_${category}`,
        label: category.replace(/_/g, ' '),
        isActive: true,
      });
    });

    return quickFilters;
  },
}));

/**
 * Selector for active filter count
 */
export const selectActiveFilterCount = (state: FilterStoreState) =>
  state.getActiveFilterCount();

/**
 * Selector for modal visibility
 */
export const selectIsModalVisible = (state: FilterStoreState) =>
  state.isModalVisible;

/**
 * Selector for current filters (or temp if modal open)
 */
export const selectCurrentFilters = (state: FilterStoreState) =>
  state.tempFilters ?? state.filters;
