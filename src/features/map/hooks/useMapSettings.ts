import { useState, useCallback, ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MapStyleKey } from '../../../shared/config/mapbox.config';

// Type for MaterialCommunityIcons name
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface MapStyleOption {
  key: MapStyleKey;
  label: string;
  icon: IconName;
}

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  { key: 'cycling', label: 'Cycling', icon: 'bicycle' },
  { key: 'outdoors', label: 'Outdoors', icon: 'pine-tree' },
  { key: 'streets', label: 'Streets', icon: 'city' },
  { key: 'satellite', label: 'Satellite', icon: 'satellite-variant' },
  { key: 'topo', label: 'Topo', icon: 'terrain' },
  { key: 'terrain', label: 'Terrain', icon: 'image-filter-hdr' },
  { key: 'natgeo', label: 'NatGeo', icon: 'earth' },
  { key: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { key: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
];

export interface UseMapSettingsReturn {
  show3DTerrain: boolean;
  show3DBuildings: boolean;
  currentMapStyle: MapStyleKey;
  showStylePicker: boolean;
  styleOptions: MapStyleOption[];

  // Actions
  toggle3DTerrain: () => void;
  toggle3DBuildings: () => void;
  setMapStyle: (style: MapStyleKey) => void;
  openStylePicker: () => void;
  closeStylePicker: () => void;
}

/**
 * Hook for managing map settings (3D terrain, buildings, style)
 */
export function useMapSettings(): UseMapSettingsReturn {
  const [show3DTerrain, setShow3DTerrain] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(true);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyleKey>('cycling');
  const [showStylePicker, setShowStylePicker] = useState(false);

  const toggle3DTerrain = useCallback(() => {
    setShow3DTerrain((prev) => !prev);
  }, []);

  const toggle3DBuildings = useCallback(() => {
    setShow3DBuildings((prev) => !prev);
  }, []);

  const setMapStyle = useCallback((style: MapStyleKey) => {
    setCurrentMapStyle(style);
    setShowStylePicker(false);
  }, []);

  const openStylePicker = useCallback(() => {
    setShowStylePicker(true);
  }, []);

  const closeStylePicker = useCallback(() => {
    setShowStylePicker(false);
  }, []);

  return {
    show3DTerrain,
    show3DBuildings,
    currentMapStyle,
    showStylePicker,
    styleOptions: MAP_STYLE_OPTIONS,
    toggle3DTerrain,
    toggle3DBuildings,
    setMapStyle,
    openStylePicker,
    closeStylePicker,
  };
}
