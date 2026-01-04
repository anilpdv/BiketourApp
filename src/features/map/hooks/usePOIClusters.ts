/**
 * POI Clustering Hook
 * Computes clusters from POIs for rendering with MarkerView components
 * Zoom-aware: clusters break apart when zooming in past threshold
 */

import { useMemo } from 'react';
import { POI } from '../../pois';

export interface Cluster {
  id: string;
  coordinate: [number, number]; // [longitude, latitude]
  pointCount: number;
  poiIds: string[];
}

export interface ClusterResult {
  clusters: Cluster[];
  unclusteredPOIs: POI[];
}

// Cluster threshold - above this zoom level, don't cluster
const CLUSTER_MAX_ZOOM = 14;

/**
 * Calculate grid size based on zoom level
 * Higher zoom = smaller grid = smaller/fewer clusters
 */
function getGridSizeForZoom(zoom: number): number {
  // At zoom 8: grid ~0.1 degrees (~11km)
  // At zoom 12: grid ~0.006 degrees (~0.7km)
  // At zoom 14+: no clustering
  const baseGrid = 0.1;
  const zoomFactor = Math.pow(2, zoom - 8);
  return baseGrid / zoomFactor;
}

/**
 * Zoom-aware grid-based clustering algorithm
 * Groups POIs that fall within the same grid cell
 * At high zoom levels (>= CLUSTER_MAX_ZOOM), returns all POIs unclustered
 */
export function usePOIClusters(
  pois: POI[],
  zoomLevel: number = 10
): ClusterResult {
  return useMemo(() => {
    if (pois.length === 0) {
      return { clusters: [], unclusteredPOIs: [] };
    }

    // At high zoom, don't cluster at all - show individual POIs
    if (zoomLevel >= CLUSTER_MAX_ZOOM) {
      return { clusters: [], unclusteredPOIs: pois };
    }

    // Calculate grid size based on zoom
    const gridSize = getGridSizeForZoom(zoomLevel);

    // Grid cells: key is "lat_lon" rounded to grid
    const grid = new Map<string, POI[]>();

    // Assign each POI to a grid cell
    for (const poi of pois) {
      const gridLat = Math.floor(poi.latitude / gridSize) * gridSize;
      const gridLon = Math.floor(poi.longitude / gridSize) * gridSize;
      const key = `${gridLat.toFixed(6)}_${gridLon.toFixed(6)}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(poi);
    }

    const clusters: Cluster[] = [];
    const unclusteredPOIs: POI[] = [];

    // Process each grid cell
    for (const [key, cellPOIs] of grid) {
      if (cellPOIs.length === 1) {
        // Single POI - not clustered
        unclusteredPOIs.push(cellPOIs[0]);
      } else {
        // Multiple POIs - create cluster
        // Calculate centroid
        let sumLat = 0;
        let sumLon = 0;
        const poiIds: string[] = [];

        for (const poi of cellPOIs) {
          sumLat += poi.latitude;
          sumLon += poi.longitude;
          poiIds.push(poi.id);
        }

        const centerLat = sumLat / cellPOIs.length;
        const centerLon = sumLon / cellPOIs.length;

        clusters.push({
          id: `cluster_${key}`,
          coordinate: [centerLon, centerLat],
          pointCount: cellPOIs.length,
          poiIds,
        });
      }
    }

    return { clusters, unclusteredPOIs };
  }, [pois, zoomLevel]);
}
