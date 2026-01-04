import { useRef, useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Camera } from '@rnmapbox/maps';
import type Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { ParsedRoute } from '../../routes/types';
import { MapBounds } from '../../../shared/types';
import { logger } from '../../../shared/utils';

export { MapBounds } from '../../../shared/types';

export interface CameraSettings {
  centerCoordinate: [number, number];
  zoomLevel: number;
}

export interface UseMapCameraReturn {
  cameraRef: React.RefObject<Camera | null>;
  currentBounds: MapBounds | null;
  currentZoom: number;
  initialCameraSettings: CameraSettings;

  // Actions
  handleCameraChanged: (state: Mapbox.MapState) => void;
  flyTo: (coordinate: [number, number], zoom?: number) => void;
  fitToBounds: (bounds: MapBounds, padding?: number) => void;
}

/**
 * Hook for managing map camera position and bounds
 */
export function useMapCamera(
  selectedFullRoute: ParsedRoute | null,
  location: Location.LocationObject | null
): UseMapCameraReturn {
  const cameraRef = useRef<Camera>(null);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(10); // Default zoom

  // Calculate initial camera settings
  const initialCameraSettings = useMemo((): CameraSettings => {
    if (selectedFullRoute) {
      const { minLat, maxLat, minLon, maxLon } = selectedFullRoute.bounds;

      // Validate bounds are valid numbers
      if (
        !isFinite(minLat) || !isFinite(maxLat) ||
        !isFinite(minLon) || !isFinite(maxLon)
      ) {
        logger.warn('ui', 'Invalid route bounds, using defaults', { bounds: selectedFullRoute.bounds });
        // Fall through to location or default
      } else {
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const latDelta = maxLat - minLat;
        // Convert lat delta to approximate zoom level
        const zoom = Math.max(1, Math.min(14, Math.log2(360 / (latDelta * 1.3))));

        return {
          centerCoordinate: [centerLon, centerLat],
          zoomLevel: zoom,
        };
      }
    }
    if (location) {
      return {
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: 8,
      };
    }
    // Default: Central Europe
    return {
      centerCoordinate: [8.0, 48.8566],
      zoomLevel: 4,
    };
  }, [selectedFullRoute, location]);

  // Handle camera changes
  const handleCameraChanged = useCallback((state: Mapbox.MapState) => {
    try {
      // Update zoom level
      if (state.properties.zoom !== undefined) {
        setCurrentZoom(state.properties.zoom);
      }

      if (!state.properties.bounds) return;

      // Validate bounds before using
      const { ne, sw } = state.properties.bounds;
      if (!Array.isArray(ne) || !Array.isArray(sw) || ne.length !== 2 || sw.length !== 2) {
        logger.warn('ui', 'Invalid bounds structure in camera changed event');
        return;
      }

      const bounds: MapBounds = {
        ne: ne as [number, number],
        sw: sw as [number, number],
      };
      setCurrentBounds(bounds);
    } catch (error) {
      logger.warn('ui', 'Error handling camera changed', error);
      // Don't crash - just skip bounds update
    }
  }, []);

  // Fly to a specific coordinate
  const flyTo = useCallback((coordinate: [number, number], zoom: number = 14) => {
    try {
      cameraRef.current?.setCamera({
        centerCoordinate: coordinate,
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    } catch (error) {
      logger.error('ui', 'Camera flyTo failed', error);
      Alert.alert('Camera Error', 'Unable to move camera. Please try again.');
    }
  }, []);

  // Fit to bounds
  const fitToBounds = useCallback((bounds: MapBounds, padding: number = 50) => {
    // Validate bounds before calling
    if (!bounds?.ne || !bounds?.sw) {
      logger.warn('ui', 'Invalid bounds provided to fitToBounds');
      return;
    }

    try {
      cameraRef.current?.fitBounds(bounds.ne, bounds.sw, padding, 1000);
    } catch (error) {
      logger.error('ui', 'Camera fitToBounds failed', error);
      Alert.alert('Camera Error', 'Unable to fit bounds. Please try again.');
    }
  }, []);

  return {
    cameraRef,
    currentBounds,
    currentZoom,
    initialCameraSettings,
    handleCameraChanged,
    flyTo,
    fitToBounds,
  };
}
