import { useRef, useCallback, useMemo, useState } from 'react';
import { Camera } from '@rnmapbox/maps';
import type Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { ParsedRoute } from '../../routes/types';

export interface MapBounds {
  ne: [number, number];
  sw: [number, number];
}

export interface CameraSettings {
  centerCoordinate: [number, number];
  zoomLevel: number;
}

export interface UseMapCameraReturn {
  cameraRef: React.RefObject<Camera>;
  currentBounds: MapBounds | null;
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

  // Calculate initial camera settings
  const initialCameraSettings = useMemo((): CameraSettings => {
    if (selectedFullRoute) {
      const centerLat = (selectedFullRoute.bounds.minLat + selectedFullRoute.bounds.maxLat) / 2;
      const centerLon = (selectedFullRoute.bounds.minLon + selectedFullRoute.bounds.maxLon) / 2;
      const latDelta = selectedFullRoute.bounds.maxLat - selectedFullRoute.bounds.minLat;
      // Convert lat delta to approximate zoom level
      const zoom = Math.max(1, Math.min(14, Math.log2(360 / (latDelta * 1.3))));
      return {
        centerCoordinate: [centerLon, centerLat],
        zoomLevel: zoom,
      };
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
    if (!state.properties.bounds) return;

    const bounds: MapBounds = {
      ne: state.properties.bounds.ne as [number, number],
      sw: state.properties.bounds.sw as [number, number],
    };
    setCurrentBounds(bounds);
  }, []);

  // Fly to a specific coordinate
  const flyTo = useCallback((coordinate: [number, number], zoom: number = 14) => {
    cameraRef.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel: zoom,
      animationDuration: 1000,
    });
  }, []);

  // Fit to bounds
  const fitToBounds = useCallback((bounds: MapBounds, padding: number = 50) => {
    cameraRef.current?.fitBounds(bounds.ne, bounds.sw, padding, 1000);
  }, []);

  return {
    cameraRef,
    currentBounds,
    initialCameraSettings,
    handleCameraChanged,
    flyTo,
    fitToBounds,
  };
}
