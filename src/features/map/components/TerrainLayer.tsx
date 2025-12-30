import React, { memo } from 'react';
import { RasterDemSource, Terrain, SkyLayer, FillExtrusionLayer } from '@rnmapbox/maps';
import { MapStyleKey } from '../../../shared/config/mapbox.config';

export interface TerrainLayerProps {
  show3DTerrain: boolean;
  show3DBuildings: boolean;
  mapStyle: MapStyleKey;
}

/**
 * Map layer for 3D terrain, sky, and buildings
 */
export const TerrainLayer = memo(function TerrainLayer({
  show3DTerrain,
  show3DBuildings,
  mapStyle,
}: TerrainLayerProps) {
  return (
    <>
      {/* 3D Terrain */}
      {show3DTerrain && (
        <>
          <RasterDemSource
            id="mapbox-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxZoomLevel={14}
          />
          <Terrain sourceID="mapbox-dem" exaggeration={1.5} />
          <SkyLayer
            id="sky"
            style={{
              skyType: 'atmosphere',
              skyAtmosphereSun: [0.0, 90.0],
              skyAtmosphereSunIntensity: 15,
            }}
          />
        </>
      )}

      {/* 3D Buildings */}
      {show3DBuildings && (
        <FillExtrusionLayer
          id="3d-buildings"
          sourceID="composite"
          sourceLayerID="building"
          minZoomLevel={14}
          maxZoomLevel={22}
          style={{
            fillExtrusionColor: mapStyle === 'dark' ? '#242424' : '#ddd',
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'min_height'],
            fillExtrusionOpacity: 0.8,
          }}
        />
      )}
    </>
  );
});
