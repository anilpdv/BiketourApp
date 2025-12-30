import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import * as Location from 'expo-location';
import {
  usePOIStore,
  fetchPOIsWithCache,
  fetchPOIsAlongRouteWithCache,
  addDistanceFromUser,
  POI,
  POICategory,
  BoundingBox,
} from '../../pois';
import {
  CATEGORY_COLORS,
  CATEGORY_TO_MAKI_ICON,
  CATEGORY_TO_EMOJI,
} from '../../pois/config/poiIcons';
import { ParsedRoute } from '../../routes/types';

export interface MapBounds {
  ne: [number, number];
  sw: [number, number];
}

export interface UsePOIDisplayReturn {
  showPOIs: boolean;
  pois: POI[];
  filteredPOIs: POI[];
  poiCounts: Record<POICategory, number>;
  poiGeoJSON: FeatureCollection<Point>;
  isLoading: boolean;
  filters: { categories: POICategory[] };
  favoriteIds: Set<string>;

  // Actions
  togglePOIs: () => void;
  toggleCategory: (category: POICategory) => void;
  loadPOIsForBounds: (bounds: MapBounds) => void;
  handlePOIPress: (poi: POI) => void;
  selectPOI: (poi: POI | null) => void;
}

/**
 * Hook for managing POI display and filtering
 */
export function usePOIDisplay(
  location: Location.LocationObject | null,
  enabledRoutes: ParsedRoute[]
): UsePOIDisplayReturn {
  const [showPOIs, setShowPOIs] = useState(false);
  const poiDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    pois,
    filters,
    selectedPOI,
    isLoading,
    favoriteIds,
    addPOIs,
    selectPOI,
    toggleCategory,
    setLoading: setPOIsLoading,
    loadFavorites,
  } = usePOIStore();

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Memoize filtered POIs
  const filteredPOIs = useMemo(
    () => pois.filter((poi) => filters.categories.includes(poi.category)),
    [pois, filters.categories]
  );

  // Calculate POI counts by category
  const poiCounts = useMemo(() => {
    const counts: Record<POICategory, number> = {} as Record<POICategory, number>;
    for (const poi of pois) {
      counts[poi.category] = (counts[poi.category] || 0) + 1;
    }
    return counts;
  }, [pois]);

  // Convert POIs to GeoJSON for clustering
  const poiGeoJSON = useMemo((): FeatureCollection<Point> => {
    const features: Feature<Point>[] = filteredPOIs.map((poi) => ({
      type: 'Feature' as const,
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name || '',
        category: poi.category,
        color: CATEGORY_COLORS[poi.category] || '#666',
        makiIcon: CATEGORY_TO_MAKI_ICON[poi.category] || 'marker',
        emoji: CATEGORY_TO_EMOJI[poi.category] || '📍',
        isFavorite: favoriteIds.has(poi.id),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [poi.longitude, poi.latitude],
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [filteredPOIs, favoriteIds]);

  // Toggle POI visibility
  const togglePOIs = useCallback(() => {
    setShowPOIs((prev) => !prev);
  }, []);

  // Load POIs for viewport bounds
  const loadPOIsForBounds = useCallback(
    async (bounds: MapBounds) => {
      if (!showPOIs) return;

      setPOIsLoading(true);
      try {
        const bbox: BoundingBox = {
          south: bounds.sw[1],
          north: bounds.ne[1],
          west: bounds.sw[0],
          east: bounds.ne[0],
        };

        const fetchedPOIs = await fetchPOIsWithCache(bbox);

        let processedPOIs = fetchedPOIs;
        if (location) {
          processedPOIs = addDistanceFromUser(
            fetchedPOIs,
            location.coords.latitude,
            location.coords.longitude
          );
        }

        addPOIs(processedPOIs);
      } catch (error) {
        console.error('Failed to fetch POIs:', error);
      } finally {
        setPOIsLoading(false);
      }
    },
    [showPOIs, location, addPOIs, setPOIsLoading]
  );

  // Handle POI press
  const handlePOIPress = useCallback(
    (poi: POI) => {
      selectPOI(poi);
    },
    [selectPOI]
  );

  // Load POIs along enabled routes
  useEffect(() => {
    if (!showPOIs || enabledRoutes.length === 0) return;

    const loadRoutePOIs = async () => {
      setPOIsLoading(true);
      try {
        for (const route of enabledRoutes) {
          const routePOIs = await fetchPOIsAlongRouteWithCache(route.points, 10);

          let processedPOIs = routePOIs;
          if (location) {
            processedPOIs = addDistanceFromUser(
              routePOIs,
              location.coords.latitude,
              location.coords.longitude
            );
          }

          addPOIs(processedPOIs);
        }
      } catch (error) {
        console.error('Failed to fetch POIs along route:', error);
      } finally {
        setPOIsLoading(false);
      }
    };

    loadRoutePOIs();
  }, [enabledRoutes.length, showPOIs]);

  return {
    showPOIs,
    pois,
    filteredPOIs,
    poiCounts,
    poiGeoJSON,
    isLoading,
    filters,
    favoriteIds,
    togglePOIs,
    toggleCategory,
    loadPOIsForBounds,
    handlePOIPress,
    selectPOI,
  };
}
