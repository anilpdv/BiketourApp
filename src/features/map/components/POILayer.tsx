import React, { memo, useCallback } from 'react';
import { ShapeSource, CircleLayer, SymbolLayer, Images } from '@maplibre/maplibre-react-native';
import type { FeatureCollection, Point } from 'geojson';
import { POI } from '../../pois';
import { colors } from '../../../shared/design/tokens';
import type { MarkerImagesMap } from '../hooks/useMarkerImages';

export interface POILayerProps {
  visible: boolean;
  pois: POI[];
  poiGeoJSON: FeatureCollection<Point>;
  zoomLevel: number;
  onPOIPress: (poi: POI) => void;
  markerImages?: MarkerImagesMap | null;
}

/**
 * Map layer for rendering POIs with custom marker images
 * Uses ShapeSource + Images + SymbolLayer for pure native rendering (no React Native views)
 * This avoids Fabric view recycling crashes
 */
export const POILayer = memo(function POILayer({
  visible,
  pois,
  poiGeoJSON,
  onPOIPress,
  markerImages,
}: POILayerProps) {
  // Handle POI press from ShapeSource
  const handlePress = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature?.properties?.id) {
      const poi = pois.find(p => p.id === feature.properties.id);
      if (poi) {
        onPOIPress(poi);
      }
    }
  }, [pois, onPOIPress]);

  // MapLibre cannot handle null children - always return empty fragment
  if (!visible || poiGeoJSON.features.length === 0) {
    return <></>;
  }

  const hasCustomMarkers = markerImages && Object.keys(markerImages).length > 0;

  return (
    <>
      {/* Register custom marker images if available */}
      {hasCustomMarkers && <Images images={markerImages} />}

      <ShapeSource
        id="poi-source"
        shape={poiGeoJSON}
        onPress={handlePress}
        cluster={true}
        clusterRadius={50}
        clusterMaxZoomLevel={14}
      >
        {/* Cluster images with count - uses pre-generated images to avoid font/glyph issues */}
        {hasCustomMarkers ? (
          <SymbolLayer
            id="poi-clusters"
            filter={['has', 'point_count']}
            style={{
              iconImage: [
                'step',
                ['get', 'point_count'],
                'cluster-2',      // default (2)
                3, 'cluster-3',
                4, 'cluster-4',
                5, 'cluster-5',
                6, 'cluster-6',
                7, 'cluster-7',
                8, 'cluster-8',
                9, 'cluster-9',
                10, 'cluster-10',
                15, 'cluster-15',
                20, 'cluster-20',
                25, 'cluster-25',
                30, 'cluster-30',
                40, 'cluster-40',
                50, 'cluster-50',
                75, 'cluster-75',
                99, 'cluster-99',
                100, 'cluster-99+',
              ],
              iconSize: 0.3,
              iconAllowOverlap: true,
            }}
          />
        ) : (
          /* Fallback: plain circles without numbers when images not ready */
          <CircleLayer
            id="poi-clusters"
            filter={['has', 'point_count']}
            style={{
              circleColor: colors.primary[600],
              circleRadius: [
                'step',
                ['get', 'point_count'],
                20, 10, 24, 50, 28, 100, 32,
              ],
              circleStrokeWidth: 3,
              circleStrokeColor: colors.neutral[0],
            }}
          />
        )}

        {/* Individual POIs - use custom markers if available, otherwise circles */}
        {hasCustomMarkers ? (
          <SymbolLayer
            id="poi-markers"
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: ['concat', 'marker-', ['get', 'group']],
              iconSize: 0.3,
              iconAnchor: 'bottom',
              iconAllowOverlap: true,
            }}
          />
        ) : (
          <>
            {/* Fallback: colored circle background */}
            <CircleLayer
              id="poi-points"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleColor: ['coalesce', ['get', 'groupColor'], colors.primary[500]],
                circleRadius: 14,
                circleStrokeWidth: 2,
                circleStrokeColor: colors.neutral[0],
              }}
            />
            {/* Fallback: sprite icon on top */}
            <SymbolLayer
              id="poi-icons"
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: ['coalesce', ['get', 'spriteIcon'], 'marker'],
                iconSize: 0.7,
                iconAllowOverlap: true,
              }}
            />
          </>
        )}
      </ShapeSource>
    </>
  );
});
