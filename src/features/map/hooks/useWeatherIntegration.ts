import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchWeather } from '../../weather/services/openMeteo.service';
import { WeatherForecast } from '../../weather/types';

export interface UseWeatherIntegrationReturn {
  weather: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  showDetail: boolean;

  // Actions
  toggleDetail: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing weather data
 */
export function useWeatherIntegration(
  location: Location.LocationObject | null
): UseWeatherIntegrationReturn {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchWeatherData = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);
    try {
      const weatherData = await fetchWeather(
        location.coords.latitude,
        location.coords.longitude
      );
      setWeather(weatherData);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Unable to load weather');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  // Fetch weather when location is available
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const toggleDetail = useCallback(() => {
    setShowDetail((prev) => !prev);
  }, []);

  const refresh = useCallback(async () => {
    await fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weather,
    isLoading,
    error,
    showDetail,
    toggleDetail,
    refresh,
  };
}
