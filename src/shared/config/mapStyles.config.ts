// MapLibre Configuration - Free Map Solution
// No API key required for most providers

import {
  SATELLITE_STYLE,
  TOPO_STYLE,
  HILLSHADE_STYLE,
  NATGEO_STYLE,
} from './esriStyles';

// CyclOSM - Free cycling-focused map (no API key required)
// Shows bike lanes, cycle paths, surface types, bike parking
// Perfect for bike touring apps
const CYCLOSM_STYLE = {
  version: 8,
  name: 'CyclOSM',
  sources: {
    'cyclosm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© CyclOSM | Map data © OpenStreetMap contributors',
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'cyclosm-layer',
      type: 'raster',
      source: 'cyclosm-tiles',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

// Map Style URLs and Objects (free providers)
export const MAP_STYLES: Record<string, string | object> = {
  // OpenFreeMap - 100% free, no limits, vector tiles (sharp at all zoom levels)
  outdoors: 'https://tiles.openfreemap.org/styles/liberty',
  streets: 'https://tiles.openfreemap.org/styles/bright',
  // CyclOSM - raster tiles with cycling-specific rendering (bike lanes, routes)
  cyclosm: CYCLOSM_STYLE,
  // ESRI - free for non-commercial with attribution
  satellite: SATELLITE_STYLE,
  topo: TOPO_STYLE,
  terrain: HILLSHADE_STYLE,
  natgeo: NATGEO_STYLE,
  // Carto - free, no API key required
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

export type MapStyleKey = 'outdoors' | 'streets' | 'cyclosm' | 'satellite' | 'topo' | 'terrain' | 'natgeo' | 'light' | 'dark';

// Default map style for cycling app (must be a URL string for offline packs)
export const DEFAULT_MAP_STYLE = MAP_STYLES.outdoors as string;

// Terrain tile sources (free)
export const TERRAIN_SOURCES = {
  // AWS Terrain Tiles - free, global coverage
  aws: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
};

// Styles that support offline raster tile caching
export const OFFLINE_RASTER_STYLES: MapStyleKey[] = ['cyclosm', 'satellite', 'topo'];

// Styles that support offline vector tile caching (via MapLibre OfflineManager)
export const OFFLINE_VECTOR_STYLES: MapStyleKey[] = ['outdoors'];

// All styles that support some form of offline caching
export const OFFLINE_SUPPORTED_STYLES: MapStyleKey[] = [...OFFLINE_RASTER_STYLES, ...OFFLINE_VECTOR_STYLES];

/**
 * Check if a style supports offline raster tile caching
 */
export function isRasterStyle(styleKey: MapStyleKey): boolean {
  return OFFLINE_RASTER_STYLES.includes(styleKey);
}

/**
 * Check if a style supports offline caching
 */
export function isOfflineSupportedStyle(styleKey: MapStyleKey): boolean {
  return OFFLINE_SUPPORTED_STYLES.includes(styleKey);
}

/**
 * Get display name for a style
 */
export function getStyleDisplayName(styleKey: MapStyleKey): string {
  const names: Record<MapStyleKey, string> = {
    outdoors: 'Outdoors',
    streets: 'Streets',
    cyclosm: 'CyclOSM (Cycling)',
    satellite: 'Satellite',
    topo: 'Topographic',
    terrain: 'Terrain',
    natgeo: 'National Geographic',
    light: 'Light',
    dark: 'Dark',
  };
  return names[styleKey] || styleKey;
}
