import React, { memo } from 'react';
import { ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import { colors } from '../../../shared/design/tokens';

export interface POILayerProps {
  visible: boolean;
  poiGeoJSON: FeatureCollection<Point>;
  onPOIPress: (event: any) => void;
}

/**
 * Map layer for rendering POIs with clustering
 */
export const POILayer = memo(function POILayer({
  visible,
  poiGeoJSON,
  onPOIPress,
}: POILayerProps) {
  if (!visible || poiGeoJSON.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource
      id="pois"
      shape={poiGeoJSON}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
      onPress={onPOIPress}
    >
      {/* Cluster circles */}
      <CircleLayer
        id="poi-clusters"
        filter={['has', 'point_count']}
        style={{
          circleColor: colors.primary[500],
          circleRadius: [
            'step',
            ['get', 'point_count'],
            20, // Base radius
            10, 25, // 10+ points
            50, 30, // 50+ points
            100, 35, // 100+ points
          ],
          circleOpacity: 0.9,
          circleStrokeColor: colors.neutral[0],
          circleStrokeWidth: 2,
        }}
      />

      {/* Cluster count text */}
      <SymbolLayer
        id="poi-cluster-count"
        filter={['has', 'point_count']}
        style={{
          textField: ['get', 'point_count_abbreviated'],
          textSize: 14,
          textColor: colors.neutral[0],
          textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          textAllowOverlap: true,
        }}
      />

      {/* Individual POI markers */}
      <CircleLayer
        id="poi-unclustered"
        filter={['!', ['has', 'point_count']]}
        style={{
          circleColor: ['get', 'color'],
          circleRadius: 12,
          circleOpacity: 0.9,
          circleStrokeColor: colors.neutral[0],
          circleStrokeWidth: 2,
        }}
      />

      {/* POI emoji icons */}
      <SymbolLayer
        id="poi-emoji"
        filter={['!', ['has', 'point_count']]}
        style={{
          textField: ['get', 'emoji'],
          textSize: 14,
          textAllowOverlap: true,
          textOffset: [0, 0],
        }}
      />

      {/* Favorite indicator */}
      <CircleLayer
        id="poi-favorite-indicator"
        filter={['all', ['!', ['has', 'point_count']], ['get', 'isFavorite']]}
        style={{
          circleColor: colors.status.warning,
          circleRadius: 6,
          circleTranslate: [10, -10],
          circleStrokeColor: colors.neutral[0],
          circleStrokeWidth: 1,
        }}
      />
    </ShapeSource>
  );
});
