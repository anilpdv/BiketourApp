/**
 * Google Places Service
 * Fetches place photos using Google Places API
 */

import Constants from 'expo-constants';
import { API_CONFIG } from '../../../shared/config/api.config';
import { createRateLimiter } from '../../../shared/utils/rateLimiter';
import { logger } from '../../../shared/utils/logger';
import { isAbortError } from '../../../shared/utils/error.utils';
import { fetchWithTimeout } from '../../../shared/api/httpClient';
import { POI, POICategory } from '../types';
import {
  GooglePlacesNearbyResponse,
  GooglePlace,
  POIPhoto,
} from '../types/googlePlaces.types';

const API_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey as string | undefined;
const rateLimiter = createRateLimiter(API_CONFIG.googlePlaces.rateLimit);

// Map POI categories to Google Places types
const CATEGORY_TYPE_MAP: Record<POICategory, string> = {
  // Camping-focused categories
  campsite: 'campground',
  motorhome_spot: 'rv_park',
  caravan_site: 'rv_park',
  wild_camping: 'park',
  // Services categories
  service_area: 'gas_station',
  drinking_water: 'point_of_interest',
  toilet: 'point_of_interest',
  shower: 'point_of_interest',
  laundry: 'laundry',
  // Accommodation categories
  hotel: 'lodging',
  hostel: 'lodging',
  guest_house: 'lodging',
  shelter: 'park',
  // Bike categories
  bike_shop: 'bicycle_store',
  bike_repair: 'bicycle_store',
  // Food categories
  restaurant: 'restaurant',
  supermarket: 'supermarket',
  picnic_site: 'park',
  // Emergency categories
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  police: 'police',
};

/**
 * Check if Google Places API is configured
 */
export function isGooglePlacesConfigured(): boolean {
  return !!API_KEY && API_KEY.length > 0;
}

/**
 * Find matching Google Place for a POI
 */
export async function findGooglePlace(poi: POI): Promise<GooglePlace | null> {
  if (!isGooglePlacesConfigured()) {
    logger.debug('api', 'Google Places API key not configured');
    return null;
  }

  await rateLimiter.waitForRateLimit();

  const type = CATEGORY_TYPE_MAP[poi.category] || 'point_of_interest';
  const params = new URLSearchParams({
    location: `${poi.latitude},${poi.longitude}`,
    radius: '50', // 50 meters radius for nearby match
    type: type,
    key: API_KEY!,
  });

  // Add keyword if POI has a name
  if (poi.name) {
    params.append('keyword', poi.name);
  }

  try {
    const url = `${API_CONFIG.googlePlaces.baseUrl}/nearbysearch/json?${params}`;

    const response = await fetchWithTimeout(url, {}, API_CONFIG.googlePlaces.timeout);

    if (!response.ok) {
      logger.warn('api', `Google Places API error: ${response.status}`);
      return null;
    }

    const data: GooglePlacesNearbyResponse = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return null;
    }

    // Return best match (first result from nearby search)
    return data.results[0];
  } catch (error) {
    if (isAbortError(error)) {
      logger.warn('api', 'Google Places request timed out');
    } else {
      logger.warn('api', 'Failed to find Google Place', error);
    }
    return null;
  }
}

/**
 * Get place details with all photos using Place Details API
 * Nearby Search only returns 1 photo, so we need this for multiple photos
 */
async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  if (!isGooglePlacesConfigured()) {
    return null;
  }

  await rateLimiter.waitForRateLimit();

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'photos,name',
    key: API_KEY!,
  });

  try {
    const url = `${API_CONFIG.googlePlaces.baseUrl}/details/json?${params}`;

    const response = await fetchWithTimeout(url, {}, API_CONFIG.googlePlaces.timeout);

    if (!response.ok) {
      logger.warn('api', `Google Places Details API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      logger.debug('api', `Place Details returned status: ${data.status}`);
      return null;
    }

    logger.debug('api', `Place Details returned ${data.result.photos?.length || 0} photos`);
    return data.result;
  } catch (error) {
    if (isAbortError(error)) {
      logger.warn('api', 'Google Places Details request timed out');
    } else {
      logger.warn('api', 'Failed to get Place Details', error);
    }
    return null;
  }
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = API_CONFIG.googlePlaces.maxPhotoWidth
): string {
  if (!isGooglePlacesConfigured()) return '';

  return `${API_CONFIG.googlePlaces.photoBaseUrl}?` +
    `maxwidth=${maxWidth}&` +
    `photo_reference=${photoReference}&` +
    `key=${API_KEY}`;
}

/**
 * Get photos for a POI
 * Uses Place Details API to get multiple photos (Nearby Search only returns 1)
 */
export async function getPOIPhotos(poi: POI): Promise<POIPhoto[]> {
  // Step 1: Find place via Nearby Search to get place_id
  const place = await findGooglePlace(poi);

  if (!place?.place_id) {
    logger.debug('api', 'No place found for POI');
    return [];
  }

  // Step 2: Get full details with all photos via Place Details API
  const details = await getPlaceDetails(place.place_id);

  if (!details?.photos || details.photos.length === 0) {
    logger.debug('api', 'No photos in Place Details');
    return [];
  }

  // Step 3: Return up to 15 photos
  return details.photos.slice(0, 15).map((photo) => ({
    uri: getPhotoUrl(photo.photo_reference),
    attribution: photo.html_attributions[0] || 'Photo from Google Places',
    width: photo.width,
    height: photo.height,
  }));
}
