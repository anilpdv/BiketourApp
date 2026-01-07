/**
 * API Configuration
 * Centralized configuration for all external API endpoints
 */

export const API_CONFIG = {
  weather: {
    baseUrl: 'https://api.open-meteo.com/v1',
    timeout: 10000,
    rateLimit: 0, // No rate limit for Open-Meteo
  },

  search: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    timeout: 8000,
    rateLimit: 1000, // 1 request per second (Nominatim policy)
    userAgent: 'BikeTourEurope/1.0 (https://github.com/biketoureurope)',
  },

  routing: {
    baseUrl: 'https://router.project-osrm.org',           // For driving/foot
    cyclingUrl: 'https://routing.openstreetmap.de/routed-bike',  // For cycling (FREE, no API key)
    timeout: 15000,
    rateLimit: 500, // Be conservative with demo server
  },

  elevation: {
    baseUrl: 'https://api.open-meteo.com/v1',
    timeout: 10000,
    rateLimit: 0,
  },

  pois: {
    // Using kumi.systems - faster alternative to overpass-api.de
    baseUrl: 'https://overpass.kumi.systems/api/interpreter',
    timeout: 35000, // 35s - must be > Overpass query timeout (25s) + network overhead
    rateLimit: 100, // 10 requests per second (kumi.systems can handle this)
  },
} as const;

/**
 * Get headers for a specific API
 */
export function getApiHeaders(api: keyof typeof API_CONFIG): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (api === 'search') {
    headers['User-Agent'] = API_CONFIG.search.userAgent;
  }

  return headers;
}
