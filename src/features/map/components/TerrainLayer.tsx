import React, { memo } from 'react';
import { RasterSource, RasterLayer, FillExtrusionLayer } from '@maplibre/maplibre-react-native';
import { MapStyleKey, TERRAIN_SOURCES } from '../../../shared/config/mapStyles.config';

export interface TerrainLayerProps {
  show3DTerrain: boolean;
  show3DBuildings: boolean;
  mapStyle: MapStyleKey;
}

/**
 * Map layer for terrain visualization and 3D buildings
 * Uses RasterLayer with terrain tiles for hillshade-like effect
 * (MapLibre React Native doesn't support HillshadeLayer or true 3D terrain)
 */
export const TerrainLayer = memo(function TerrainLayer({
  show3DTerrain,
  show3DBuildings,
  mapStyle,
}: TerrainLayerProps) {
  // Determine colors based on map style
  const isDark = mapStyle === 'dark';

  // Only OpenFreeMap styles have the 'openmaptiles' source for 3D buildings
  // Carto styles (light, dark) and ESRI satellite don't have this source
  const hasOpenMapTilesSource = ['outdoors', 'streets'].includes(mapStyle);

  // Return empty fragment instead of using ErrorBoundary with null fallback
  // MapLibre cannot handle null children
  return (
    <>
        {/* Terrain visualization using raster terrain tiles */}
        {show3DTerrain && (
          <RasterSource
            id="terrain-source"
            tileUrlTemplates={[TERRAIN_SOURCES.aws]}
            tileSize={256}
            maxZoomLevel={15}
          >
            <RasterLayer
              id="terrain-layer"
              style={{
                // Adjust opacity based on map style
                rasterOpacity: isDark ? 0.3 : 0.4,
                // Increase contrast for better terrain visibility
                rasterContrast: 0.2,
                // Slight saturation reduction for terrain
                rasterSaturation: -0.3,
                // Brightness adjustment
                rasterBrightnessMin: isDark ? 0.1 : 0.2,
                rasterBrightnessMax: isDark ? 0.7 : 0.9,
                // Smooth fade for tile transitions
                rasterFadeDuration: 300,
              }}
            />
          </RasterSource>
        )}

        {/* 3D Buildings - uses vector tile building data (only for OpenFreeMap styles) */}
        {show3DBuildings && hasOpenMapTilesSource && (
          <FillExtrusionLayer
            id="3d-buildings"
            sourceID="openmaptiles"
            sourceLayerID="building"
            minZoomLevel={14}
            maxZoomLevel={22}
            style={{
              // Height-based color interpolation for visual depth
              fillExtrusionColor: [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
                0, isDark ? '#2d2d44' : '#e8e4d8',
                50, isDark ? '#3d3d5c' : '#d8d4c8',
                100, isDark ? '#4d4d6c' : '#c8c4b8',
              ],
              // Smooth height transition when zooming in
              fillExtrusionHeight: [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0,
                14.5, ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
              ],
              fillExtrusionBase: ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
              // Smooth opacity fade-in
              fillExtrusionOpacity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0,
                14.5, 0.85,
              ],
            }}
          />
        )}
    </>
  );
});
