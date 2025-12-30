import Mapbox from '@rnmapbox/maps';

// Mapbox Access Token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYW5pbHBkdjQyIiwiYSI6ImNtanJyMXY3NTBxdnczZnFzYnVuNnA2NGYifQ.hsPYpDAxQ6bMyEOzUJ8ZeA';

// Map Style URLs
export const MAP_STYLES = {
  outdoors: 'mapbox://styles/mapbox/outdoors-v12', // Best for cycling
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

// Default map style for cycling app
export const DEFAULT_MAP_STYLE = MAP_STYLES.outdoors;

// Initialize Mapbox - call this once at app startup
export function initializeMapbox(): void {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
}

// Export token for cases where direct access is needed
export const getAccessToken = (): string => MAPBOX_ACCESS_TOKEN;
