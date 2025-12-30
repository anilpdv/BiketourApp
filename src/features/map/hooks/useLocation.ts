import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { logger } from '../../../shared/utils';

export interface UseLocationReturn {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
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
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      logger.error('ui', 'Failed to get location', error);
      setErrorMsg('Failed to get current location');
    } finally {
      setIsLoading(false);
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
  };
}
