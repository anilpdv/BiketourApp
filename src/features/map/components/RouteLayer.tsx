import React, { memo } from 'react';
import { ShapeSource, LineLayer } from '@rnmapbox/maps';
import type { FeatureCollection, LineString, GeoJsonProperties, Feature } from 'geojson';

// Type for Mapbox ShapeSource press event
export interface ShapeSourcePressEvent {
  features: Feature[];
  coordinates: { latitude: number; longitude: number };
  point: { x: number; y: number };
}

export interface RouteLayerProps {
  routeGeoJSON: FeatureCollection<LineString>;
  selectedRouteId: number | null;
  onRoutePress: (event: ShapeSourcePressEvent) => void;
}

/**
 * Map layer for rendering EuroVelo routes
 */
export const RouteLayer = memo(function RouteLayer({
  routeGeoJSON,
  selectedRouteId,
  onRoutePress,
}: RouteLayerProps) {
  if (routeGeoJSON.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource
      id="routes"
      shape={routeGeoJSON}
      onPress={onRoutePress}
    >
      {/* Background layer for unselected routes */}
      <LineLayer
        id="route-background"
        style={{
          lineColor: ['get', 'color'],
          lineWidth: [
            'case',
            ['==', ['get', 'variant'], 'developed'],
            3, // Developed routes are thinner
            5, // Full routes are thicker
          ],
          lineOpacity: [
            'case',
            ['get', 'isSelected'],
            0.9,
            0.6,
          ],
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Highlight layer for selected route */}
      <LineLayer
        id="route-highlight"
        filter={['==', ['get', 'isSelected'], true]}
        style={{
          lineColor: ['get', 'color'],
          lineWidth: 7,
          lineOpacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        aboveLayerID="route-background"
      />

      {/* Dashed pattern for developed routes */}
      <LineLayer
        id="route-developed-pattern"
        filter={['==', ['get', 'variant'], 'developed']}
        style={{
          lineColor: '#ffffff',
          lineWidth: 1,
          lineOpacity: 0.6,
          lineDasharray: [2, 4],
          lineCap: 'round',
        }}
        aboveLayerID="route-highlight"
      />
    </ShapeSource>
  );
});
