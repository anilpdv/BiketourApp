import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { logger, getUserFriendlyError } from '../../../shared/utils';

export interface UseLocationReturn {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<Location.LocationObject | null>;
}

/**
 * Hook for managing GPS location and permissions
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Enable it in Settings to center on your location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,  // Use GPS (not network)
        timeInterval: 10000,               // 10 second timeout
        mayShowUserSettingsDialog: true,   // Prompt user to enable location
      });
      setLocation(currentLocation);
    } catch (error: any) {
      logger.error('ui', 'Failed to get location', error);

      // Distinguish error types for better user guidance
      if (error.code === 'E_LOCATION_TIMEOUT') {
        setErrorMsg('GPS signal not found. Make sure you\'re outdoors or near a window.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        setErrorMsg('Location unavailable. Check that Location Services are enabled.');
      } else {
        setErrorMsg(getUserFriendlyError(error, 'getting your location'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh location on-demand (for "center on me" button)
  const refreshLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
    try {
      const freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        mayShowUserSettingsDialog: true,
      });
      setLocation(freshLocation);
      return freshLocation;
    } catch (error) {
      logger.error('ui', 'Failed to refresh location', error);
      return null;
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    location,
    errorMsg,
    isLoading,
    requestPermission,
    refreshLocation,
  };
}
