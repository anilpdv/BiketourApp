import React, { memo } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import { POI } from '../../pois';
import { POIMarker } from '../../pois/components/POIMarker';
import { ClusterMarker } from '../../pois/components/ClusterMarker';
import { usePOIClusters } from '../hooks/usePOIClusters';

export interface POILayerProps {
  visible: boolean;
  pois: POI[];
  poiGeoJSON: FeatureCollection<Point>;
  zoomLevel: number;
  onPOIPress: (poi: POI) => void;
}

/**
 * Map layer for rendering POIs with clustering
 * Uses MarkerView for both clusters and individual POIs (same z-level)
 */
export const POILayer = memo(function POILayer({
  visible,
  pois,
  zoomLevel,
  onPOIPress,
}: POILayerProps) {
  // Round zoom to nearest 0.5 to prevent flickering during smooth zoom
  // Clustering only recalculates at: 8, 8.5, 9, 9.5, 10, 10.5, etc.
  const stableZoom = Math.round(zoomLevel * 2) / 2;

  // Compute clusters from POIs (zoom-aware)
  const { clusters, unclusteredPOIs } = usePOIClusters(pois, stableZoom);

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Render clusters first (so individual markers can appear on top if needed) */}
      {clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          coordinate={cluster.coordinate}
          pointCount={cluster.pointCount}
        />
      ))}

      {/* Render unclustered POI markers */}
      {unclusteredPOIs.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onPress={onPOIPress} />
      ))}
    </>
  );
});
