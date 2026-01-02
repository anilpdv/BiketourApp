/**
 * POI GeoJSON Hook
 * Converts POIs to GeoJSON features for map display with clustering support
 */

import { useMemo, useCallback, useRef } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { POI, POICategory } from '../../pois';
import {
  CATEGORY_COLORS,
  CATEGORY_TO_MAKI_ICON,
  CATEGORY_TO_EMOJI,
} from '../../pois/config/poiIcons';

export interface POIFeatureProperties {
  id: string;
  name: string;
  category: POICategory;
  color: string;
  makiIcon: string;
  emoji: string;
  isFavorite: boolean;
}

export interface UsePOIGeoJSONReturn {
  poiGeoJSON: FeatureCollection<Point, POIFeatureProperties>;
}

/**
 * Hook for converting POIs to GeoJSON for map clustering
 * Uses feature caching to avoid recreating unchanged POI features
 */
export function usePOIGeoJSON(
  pois: POI[],
  favoriteIds: Set<string>
): UsePOIGeoJSONReturn {
  // Feature cache ref - persists across renders to avoid recreating unchanged features
  const featureCacheRef = useRef(new Map<string, Feature<Point, POIFeatureProperties>>());

  // Create a single POI feature (memoized helper)
  const createPOIFeature = useCallback(
    (poi: POI, isFavorite: boolean): Feature<Point, POIFeatureProperties> => ({
      type: 'Feature' as const,
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name || '',
        category: poi.category,
        color: CATEGORY_COLORS[poi.category] || '#666',
        makiIcon: CATEGORY_TO_MAKI_ICON[poi.category] || 'marker',
        emoji: CATEGORY_TO_EMOJI[poi.category] || '📍',
        isFavorite,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [poi.longitude, poi.latitude],
      },
    }),
    []
  );

  // Convert POIs to GeoJSON with feature caching
  const poiGeoJSON = useMemo((): FeatureCollection<Point, POIFeatureProperties> => {
    const cache = featureCacheRef.current;
    const features: Feature<Point, POIFeatureProperties>[] = [];

    for (const poi of pois) {
      const isFavorite = favoriteIds.has(poi.id);
      const cacheKey = `${poi.id}-${isFavorite}`;

      let feature = cache.get(cacheKey);
      if (!feature) {
        feature = createPOIFeature(poi, isFavorite);
        cache.set(cacheKey, feature);
      }
      features.push(feature);
    }

    return { type: 'FeatureCollection', features };
  }, [pois, favoriteIds, createPOIFeature]);

  return { poiGeoJSON };
}
