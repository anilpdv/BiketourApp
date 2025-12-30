import { create } from 'zustand';
import { SearchResult, SearchState } from '../types';
import { searchInEurope } from '../services/nominatim.service';

interface SearchStore extends SearchState {
  // Actions
  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
  addToRecent: (result: SearchResult) => void;
  removeFromRecent: (id: string) => void;
  clearRecent: () => void;
  selectResult: (result: SearchResult) => void;
  clearError: () => void;
}

const MAX_RECENT_SEARCHES = 10;

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: [],
  recentSearches: [],
  isSearching: false,
  error: null,

  setQuery: (query) => set({ query }),

  search: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ results: [], error: null });
      return;
    }

    set({ isSearching: true, error: null, query });

    try {
      const results = await searchInEurope(query.trim(), { limit: 10 });
      set({ results, isSearching: false });
    } catch (error) {
      console.error('Search error:', error);
      set({
        error: 'Search failed. Please try again.',
        isSearching: false,
        results: [],
      });
    }
  },

  clearResults: () => set({ results: [], query: '' }),

  addToRecent: (result) => {
    const { recentSearches } = get();

    // Remove if already exists
    const filtered = recentSearches.filter((r) => r.id !== result.id);

    // Add to beginning and limit size
    const updated = [result, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    set({ recentSearches: updated });
  },

  removeFromRecent: (id) => {
    const { recentSearches } = get();
    set({ recentSearches: recentSearches.filter((r) => r.id !== id) });
  },

  clearRecent: () => set({ recentSearches: [] }),

  selectResult: (result) => {
    const { addToRecent } = get();
    addToRecent(result);
    set({ query: result.name, results: [] });
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectHasResults = (state: SearchStore): boolean =>
  state.results.length > 0;

export const selectIsEmpty = (state: SearchStore): boolean =>
  state.query.length === 0 && state.results.length === 0;
