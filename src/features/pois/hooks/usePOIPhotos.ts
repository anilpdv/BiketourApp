import { useState, useEffect, useCallback } from 'react';
import { POI } from '../types';
import { POIPhoto } from '../types/googlePlaces.types';
import { getPOIPhotos, isGooglePlacesConfigured } from '../services/googlePlaces.service';
import { photoCacheRepository } from '../services/photoCache.repository';
import { logger } from '../../../shared/utils/logger';

interface UsePOIPhotosReturn {
  photos: POIPhoto[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache POI photos from Google Places API
 */
export function usePOIPhotos(poi: POI | null): UsePOIPhotosReturn {
  const [photos, setPhotos] = useState<POIPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isGooglePlacesConfigured();

  const fetchPhotos = useCallback(async () => {
    if (!poi) {
      setPhotos([]);
      return;
    }

    if (!isConfigured) {
      setPhotos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = await photoCacheRepository.getCachedPhotos(poi.id);
      if (cached !== null) {
        setPhotos(cached);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const fetchedPhotos = await getPOIPhotos(poi);

      // Cache results (even if empty, to avoid repeated failed requests)
      await photoCacheRepository.cachePhotos(poi.id, fetchedPhotos);

      setPhotos(fetchedPhotos);
    } catch (err) {
      logger.warn('api', 'Failed to fetch POI photos', err);
      setError('Failed to load photos');
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [poi?.id, isConfigured]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, isLoading, error, isConfigured, refetch: fetchPhotos };
}
