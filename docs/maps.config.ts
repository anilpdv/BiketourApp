/**
 * Map Configuration
 * 
 * Using FREE tile providers - no API keys needed for basic usage!
 * Switch between providers easily by changing ACTIVE_PROVIDER
 */

export type TileProvider = 'openfreemap' | 'stadia' | 'maptiler' | 'carto';

// Change this to switch providers
export const ACTIVE_PROVIDER: TileProvider = 'openfreemap';

interface TileConfig {
  name: string;
  styleUrl: string;
  attribution: string;
  requiresKey: boolean;
  freeLimit?: string;
}

export const TILE_PROVIDERS: Record<TileProvider, TileConfig> = {
  // 100% FREE - No API key, no limits
  openfreemap: {
    name: 'OpenFreeMap',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty/style.json',
    attribution: '© OpenFreeMap © OpenStreetMap contributors',
    requiresKey: false,
  },

  // FREE tier: 200k tiles/month - good cycling style
  stadia: {
    name: 'Stadia Maps',
    styleUrl: 'https://tiles.stadiamaps.com/styles/outdoors.json',
    attribution: '© Stadia Maps © OpenStreetMap contributors',
    requiresKey: false, // Free for limited use
    freeLimit: '200k tiles/month',
  },

  // FREE tier: 100k tiles/month - nice outdoor style
  maptiler: {
    name: 'MapTiler',
    styleUrl: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=YOUR_KEY',
    attribution: '© MapTiler © OpenStreetMap contributors',
    requiresKey: true,
    freeLimit: '100k tiles/month',
  },

  // FREE - good for simple maps
  carto: {
    name: 'Carto',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    attribution: '© Carto © OpenStreetMap contributors',
    requiresKey: false,
  },
};

export const getActiveMapConfig = (): TileConfig => {
  return TILE_PROVIDERS[ACTIVE_PROVIDER];
};

// Cycling-specific map styles (if using MapTiler with key)
export const MAP_STYLES = {
  default: 'outdoor',    // Best for cycling - shows elevation, trails
  satellite: 'satellite',
  streets: 'streets',
} as const;
