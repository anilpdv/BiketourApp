/**
 * Map Feature Hooks
 * Custom hooks for map screen functionality
 */

export { useLocation } from './useLocation';
export type { UseLocationReturn } from './useLocation';

export { useMapSettings, MAP_STYLE_OPTIONS } from './useMapSettings';
export type { UseMapSettingsReturn, MapStyleOption } from './useMapSettings';

export { useRouteManagement } from './useRouteManagement';
export type { UseRouteManagementReturn } from './useRouteManagement';

export { useWeatherIntegration } from './useWeatherIntegration';
export type { UseWeatherIntegrationReturn } from './useWeatherIntegration';

export { usePOIDisplay } from './usePOIDisplay';
export type { UsePOIDisplayReturn, MapBounds } from './usePOIDisplay';

// Focused POI hooks (can be used independently)
export { usePOIVisibility } from './usePOIVisibility';
export type { UsePOIVisibilityReturn } from './usePOIVisibility';

export { usePOISelection } from './usePOISelection';
export type { UsePOISelectionReturn } from './usePOISelection';

export { usePOIFiltering } from './usePOIFiltering';
export type { UsePOIFilteringReturn } from './usePOIFiltering';

export { usePOIFetching } from './usePOIFetching';
export type { UsePOIFetchingReturn, UsePOIFetchingOptions } from './usePOIFetching';

export { useMapCamera } from './useMapCamera';
export type { UseMapCameraReturn, CameraSettings } from './useMapCamera';

export { useRoutePlanning } from './useRoutePlanning';
export type { UseRoutePlanningReturn } from './useRoutePlanning';
