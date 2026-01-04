import React, { memo } from 'react';
import { ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import { colors } from '../../../shared/design/tokens';
import { POI } from '../../pois';
import { POIMarker } from '../../pois/components/POIMarker';

export interface POILayerProps {
  visible: boolean;
  pois: POI[];
  poiGeoJSON: FeatureCollection<Point>;
  onPOIPress: (poi: POI) => void;
}

/**
 * Map layer for rendering POIs with clustering
 * Uses POIMarker (PointAnnotation) for individual POIs with droplet-shaped pins
 * Uses CircleLayer for cluster visualization
 */
export const POILayer = memo(function POILayer({
  visible,
  pois,
  poiGeoJSON,
  onPOIPress,
}: POILayerProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Cluster circles using ShapeSource */}
      <ShapeSource
        id="poi-clusters"
        shape={poiGeoJSON}
        cluster
        clusterRadius={50}
        clusterMaxZoomLevel={14}
      >
        {/* Cluster circles */}
        <CircleLayer
          id="poi-cluster-circles"
          filter={['has', 'point_count']}
          style={{
            circleColor: colors.primary[600],
            circleRadius: [
              'step',
              ['get', 'point_count'],
              18,
              10, 22,
              50, 26,
              100, 30,
            ],
            circleOpacity: 0.95,
            circleStrokeColor: colors.neutral[0],
            circleStrokeWidth: 3,
          }}
        />

        {/* Cluster count text */}
        <SymbolLayer
          id="poi-cluster-count"
          filter={['has', 'point_count']}
          style={{
            textField: ['get', 'point_count_abbreviated'],
            textSize: 13,
            textColor: colors.neutral[0],
            textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            textAllowOverlap: true,
          }}
        />
      </ShapeSource>

      {/* Individual POI markers using PointAnnotation */}
      {pois.map(poi => (
        <POIMarker key={poi.id} poi={poi} onPress={onPOIPress} />
      ))}
    </>
  );
});
