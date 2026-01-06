import React, { memo } from 'react';
import { ShapeSource, LineLayer } from '@maplibre/maplibre-react-native';
import type { FeatureCollection, LineString, Feature } from 'geojson';
import { SurfaceSegment, SURFACE_COLORS, SurfaceType } from '../../routes/types';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';

export interface SurfaceLayerProps {
  surfaceGeoJSON: FeatureCollection<LineString> | null;
  visible: boolean;
}

/**
 * Convert surface segments to GeoJSON for map rendering
 */
export function surfaceSegmentsToGeoJSON(
  segments: SurfaceSegment[]
): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = segments.map((segment, index) => ({
    type: 'Feature',
    properties: {
      id: `surface-${index}`,
      surface: segment.surface,
      color: SURFACE_COLORS[segment.surface],
    },
    geometry: {
      type: 'LineString',
      coordinates: segment.coordinates,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Map layer for rendering route surface types
 * Overlays on top of the base route to show paved/gravel/unpaved sections
 */
export const SurfaceLayer = memo(function SurfaceLayer({
  surfaceGeoJSON,
  visible,
}: SurfaceLayerProps) {
  if (!visible || !surfaceGeoJSON || surfaceGeoJSON.features.length === 0) {
    return <></>;
  }

  return (
    <ErrorBoundary fallback={<></>}>
      <ShapeSource id="surface-data" shape={surfaceGeoJSON}>
        {/* Base surface line */}
        <LineLayer
          id="surface-line"
          style={{
            lineColor: ['get', 'color'],
            lineWidth: 4,
            lineOpacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
            lineBlur: 0,
          }}
        />

        {/* Dashed pattern for gravel */}
        <LineLayer
          id="surface-gravel-pattern"
          filter={['==', ['get', 'surface'], 'gravel']}
          style={{
            lineColor: '#FFFFFF',
            lineWidth: 1,
            lineOpacity: 0.5,
            lineDasharray: [4, 4],
            lineCap: 'round',
            lineBlur: 0,
          }}
          aboveLayerID="surface-line"
        />

        {/* Dotted pattern for unpaved */}
        <LineLayer
          id="surface-unpaved-pattern"
          filter={['==', ['get', 'surface'], 'unpaved']}
          style={{
            lineColor: '#FFFFFF',
            lineWidth: 1,
            lineOpacity: 0.5,
            lineDasharray: [2, 6],
            lineCap: 'round',
            lineBlur: 0,
          }}
          aboveLayerID="surface-line"
        />
      </ShapeSource>
    </ErrorBoundary>
  );
});

export default SurfaceLayer;
