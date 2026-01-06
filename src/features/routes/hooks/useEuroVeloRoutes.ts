import { useState, useMemo, useCallback } from 'react';
import contentConfig from '../../../shared/config/content.config.json';
import { EuroVeloRoute } from '../types';

// Filter state interface
export interface EuroVeloFilters {
  searchQuery: string;
  difficulties: Array<'easy' | 'moderate' | 'difficult'>;
  distanceRange: 'all' | 'short' | 'medium' | 'long' | 'epic';
  countries: string[];
}

// Distance range definitions (in km)
const DISTANCE_RANGES = {
  all: { min: 0, max: Infinity },
  short: { min: 0, max: 2000 },      // < 2000 km
  medium: { min: 2000, max: 5000 },  // 2000 - 5000 km
  long: { min: 5000, max: 8000 },    // 5000 - 8000 km
  epic: { min: 8000, max: Infinity }, // > 8000 km
};

// Get all unique countries from routes
const getAllCountries = (routes: EuroVeloRoute[]): string[] => {
  const countrySet = new Set<string>();
  routes.forEach(route => {
    route.countries.forEach(country => countrySet.add(country));
  });
  return Array.from(countrySet).sort();
};

// Default filters
const DEFAULT_FILTERS: EuroVeloFilters = {
  searchQuery: '',
  difficulties: [],
  distanceRange: 'all',
  countries: [],
};

/**
 * Hook for loading and filtering EuroVelo routes
 */
export function useEuroVeloRoutes() {
  const [filters, setFilters] = useState<EuroVeloFilters>(DEFAULT_FILTERS);

  // Load all enabled routes from config
  const allRoutes = useMemo<EuroVeloRoute[]>(() => {
    return (contentConfig.routes as EuroVeloRoute[]).filter(route => route.enabled);
  }, []);

  // Get all available countries for filter dropdown
  const availableCountries = useMemo(() => getAllCountries(allRoutes), [allRoutes]);

  // Filter routes based on current filters
  const filteredRoutes = useMemo(() => {
    return allRoutes.filter(route => {
      // Search query filter (name, description, key cities)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          route.name,
          route.description,
          route.fullDescription || '',
          ...(route.keyCities || []),
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Difficulty filter
      if (filters.difficulties.length > 0) {
        if (!filters.difficulties.includes(route.difficulty)) {
          return false;
        }
      }

      // Distance range filter
      if (filters.distanceRange !== 'all') {
        const range = DISTANCE_RANGES[filters.distanceRange];
        if (route.distance < range.min || route.distance >= range.max) {
          return false;
        }
      }

      // Country filter
      if (filters.countries.length > 0) {
        const hasMatchingCountry = route.countries.some(country =>
          filters.countries.includes(country)
        );
        if (!hasMatchingCountry) {
          return false;
        }
      }

      return true;
    });
  }, [allRoutes, filters]);

  // Filter actions
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleDifficulty = useCallback((difficulty: 'easy' | 'moderate' | 'difficult') => {
    setFilters(prev => {
      const newDifficulties = prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter(d => d !== difficulty)
        : [...prev.difficulties, difficulty];
      return { ...prev, difficulties: newDifficulties };
    });
  }, []);

  const setDistanceRange = useCallback((range: EuroVeloFilters['distanceRange']) => {
    setFilters(prev => ({ ...prev, distanceRange: range }));
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setFilters(prev => {
      const newCountries = prev.countries.includes(country)
        ? prev.countries.filter(c => c !== country)
        : [...prev.countries, country];
      return { ...prev, countries: newCountries };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.difficulties.length > 0 ||
      filters.distanceRange !== 'all' ||
      filters.countries.length > 0
    );
  }, [filters]);

  return {
    // Data
    routes: filteredRoutes,
    allRoutes,
    totalCount: allRoutes.length,
    filteredCount: filteredRoutes.length,
    availableCountries,

    // Current filters
    filters,
    hasActiveFilters,

    // Filter actions
    setSearchQuery,
    toggleDifficulty,
    setDistanceRange,
    toggleCountry,
    clearFilters,
    setFilters,
  };
}

export default useEuroVeloRoutes;
