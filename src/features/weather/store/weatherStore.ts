import { create } from 'zustand';
import { WeatherForecast } from '../types';

interface WeatherState {
  // Current location weather
  currentWeather: WeatherForecast | null;

  // Cached weather by location key
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
}));

// Selectors
export const selectCurrentTemp = (state: WeatherState): number | null =>
  state.currentWeather?.current.temperature ?? null;

export const selectTodayForecast = (state: WeatherState) =>
  state.currentWeather?.daily[0] ?? null;

export const selectWeekForecast = (state: WeatherState) =>
  state.currentWeather?.daily ?? [];
