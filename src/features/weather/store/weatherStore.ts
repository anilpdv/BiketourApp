import { create } from 'zustand';
import { WeatherForecast } from '../types';
import { weatherRepository } from '../services/weather.repository';
import { fetchWeather as fetchWeatherFromAPI } from '../services/openMeteo.service';
import { logger } from '../../../shared/utils';

interface WeatherState {
  // Current location weather
  currentWeather: WeatherForecast | null;

  // Cached weather by location key (in-memory for quick access)
  weatherCache: Map<string, WeatherForecast>;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Last fetch timestamp
  lastFetchedAt: Date | null;

  // Actions
  setCurrentWeather: (weather: WeatherForecast) => void;
  cacheWeather: (key: string, weather: WeatherForecast) => void;
  getCachedWeather: (key: string) => WeatherForecast | undefined;
  clearCache: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Enhanced actions with SQLite support
  fetchWeather: (lat: number, lon: number) => Promise<WeatherForecast | null>;
}

// Generate cache key from coordinates
export function getWeatherCacheKey(lat: number, lon: number): string {
  // Round to 2 decimal places (~1km precision)
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

// Check if cached weather is still valid (24h)
export function isCacheValid(weather: WeatherForecast): boolean {
  const now = new Date();
  const fetchedAt = new Date(weather.fetchedAt);
  const hoursDiff = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  currentWeather: null,
  weatherCache: new Map(),
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  setCurrentWeather: (weather) =>
    set({
      currentWeather: weather,
      lastFetchedAt: new Date(),
    }),

  cacheWeather: (key, weather) =>
    set((state) => {
      const newCache = new Map(state.weatherCache);
      newCache.set(key, weather);
      return { weatherCache: newCache };
    }),

  getCachedWeather: (key) => {
    const cached = get().weatherCache.get(key);
    if (cached && isCacheValid(cached)) {
      return cached;
    }
    return undefined;
  },

  clearCache: () =>
    set({
      weatherCache: new Map(),
      currentWeather: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Fetch weather with SQLite cache support
  fetchWeather: async (lat, lon) => {
    const cacheKey = getWeatherCacheKey(lat, lon);

    // 1. Check in-memory cache first (fastest)
    const memCached = get().getCachedWeather(cacheKey);
    if (memCached) {
      set({ currentWeather: memCached });
      return memCached;
    }

    // 2. Check SQLite cache (persisted across app restarts)
    try {
      const dbCached = await weatherRepository.getCached(lat, lon);
      if (dbCached) {
        // Update in-memory cache
        const newCache = new Map(get().weatherCache);
        newCache.set(cacheKey, dbCached);
        set({
          currentWeather: dbCached,
          weatherCache: newCache,
          lastFetchedAt: dbCached.fetchedAt,
        });
        return dbCached;
      }
    } catch (error) {
      logger.warn('cache', 'SQLite cache read error', error);
      // Continue to API fetch
    }

    // 3. Fetch from API
    set({ isLoading: true, error: null });

    try {
      const weather = await fetchWeatherFromAPI(lat, lon);

      // Update in-memory cache
      const newCache = new Map(get().weatherCache);
      newCache.set(cacheKey, weather);

      set({
        currentWeather: weather,
        weatherCache: newCache,
        lastFetchedAt: new Date(),
        isLoading: false,
      });

      // Persist to SQLite (async, non-blocking)
      weatherRepository.cache(weather).catch((error) => {
        logger.warn('cache', 'SQLite cache write error', error);
      });

      return weather;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },
}));

// Selectors
export const selectCurrentTemp = (state: WeatherState): number | null =>
  state.currentWeather?.current.temperature ?? null;

export const selectTodayForecast = (state: WeatherState) =>
  state.currentWeather?.daily[0] ?? null;

export const selectWeekForecast = (state: WeatherState) =>
  state.currentWeather?.daily ?? [];
