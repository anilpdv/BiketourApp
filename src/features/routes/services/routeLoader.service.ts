import { File } from 'expo-file-system/next';
import { parseGPX, gpxToRoute } from './gpxParser.service';
import { routeCacheRepository, computeGPXHash } from './routeCache.repository';
import { ParsedRoute, EuroVeloRoute, RouteVariant } from '../types';
import { logger } from '../../../shared/utils';

// expo-asset doesn't have proper TS declarations in this environment
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Asset } = require('expo-asset') as { Asset: { fromModule: (module: number) => { downloadAsync: () => Promise<void>; localUri: string | null } } };

// All EuroVelo routes available
const EUROVELO_ROUTE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19];

// Routes that have developed versions
const ROUTES_WITH_DEVELOPED = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19];

// Color palette for routes - each route has full (medium-saturated) and developed (bold) colors
const ROUTE_COLORS: Record<number, { full: string; developed: string }> = {
  1:  { full: '#42A5F5', developed: '#1565C0' },  // Blue
  2:  { full: '#66BB6A', developed: '#2E7D32' },  // Green
  3:  { full: '#FFA726', developed: '#EF6C00' },  // Orange
  4:  { full: '#AB47BC', developed: '#7B1FA2' },  // Purple
  5:  { full: '#26C6DA', developed: '#00838F' },  // Cyan
  6:  { full: '#EF5350', developed: '#C62828' },  // Red
  7:  { full: '#FFEE58', developed: '#F9A825' },  // Yellow
  8:  { full: '#8D6E63', developed: '#5D4037' },  // Brown
  9:  { full: '#78909C', developed: '#455A64' },  // Blue Grey
  10: { full: '#EC407A', developed: '#AD1457' },  // Pink
  11: { full: '#4CAF50', developed: '#388E3C' },  // Light Green
  12: { full: '#29B6F6', developed: '#0277BD' },  // Light Blue
  13: { full: '#FF7043', developed: '#E65100' },  // Deep Orange
  14: { full: '#5C6BC0', developed: '#303F9F' },  // Indigo
  15: { full: '#26A69A', developed: '#00695C' },  // Teal
  17: { full: '#C0CA33', developed: '#9E9D24' },  // Lime
  19: { full: '#FF5722', developed: '#D84315' },  // Deep Orange
};

// Route names
const ROUTE_NAMES: Record<number, string> = {
  1:  'Atlantic Coast Route',
  2:  'Capitals Route',
  3:  'Pilgrims Route',
  4:  'Central Europe Route',
  5:  'Via Romea Francigena',
  6:  'Atlantic - Black Sea',
  7:  'Sun Route',
  8:  'Mediterranean Route',
  9:  'Baltic - Adriatic',
  10: 'Baltic Sea Cycle Route',
  11: 'East Europe Route',
  12: 'North Sea Cycle Route',
  13: 'Iron Curtain Trail',
  14: 'Waters of Central Europe',
  15: 'Rhine Cycle Route',
  17: 'Rhone Cycle Route',
  19: 'Meuse Cycle Route',
};

// Route metadata for UI display
const ROUTE_METADATA: Record<number, { distance: string; countries: number }> = {
  1:  { distance: '11,150 km', countries: 6 },
  2:  { distance: '5,500 km', countries: 8 },
  3:  { distance: '5,300 km', countries: 7 },
  4:  { distance: '5,100 km', countries: 11 },
  5:  { distance: '3,200 km', countries: 5 },
  6:  { distance: '4,450 km', countries: 10 },
  7:  { distance: '7,700 km', countries: 7 },
  8:  { distance: '7,500 km', countries: 11 },
  9:  { distance: '2,050 km', countries: 9 },
  10: { distance: '9,000 km', countries: 9 },
  11: { distance: '5,984 km', countries: 9 },
  12: { distance: '5,932 km', countries: 7 },
  13: { distance: '10,400 km', countries: 20 },
  14: { distance: '1,125 km', countries: 5 },
  15: { distance: '1,500 km', countries: 4 },
  17: { distance: '1,115 km', countries: 2 },
  19: { distance: '1,050 km', countries: 3 },
};

// GPX file imports - we import them as assets
// Asset type from expo-asset is used at runtime
const GPX_ASSETS: Record<string, number> = {
  '1': require('../../../../assets/euroveloRoutes/1.gpx'),
  '2': require('../../../../assets/euroveloRoutes/2.gpx'),
  '2-developed': require('../../../../assets/euroveloRoutes/2-developed.gpx'),
  '3': require('../../../../assets/euroveloRoutes/3.gpx'),
  '3-developed': require('../../../../assets/euroveloRoutes/3-developed.gpx'),
  '4': require('../../../../assets/euroveloRoutes/4.gpx'),
  '4-developed': require('../../../../assets/euroveloRoutes/4-developed.gpx'),
  '5': require('../../../../assets/euroveloRoutes/5.gpx'),
  '5-developed': require('../../../../assets/euroveloRoutes/5-developed.gpx'),
  '6': require('../../../../assets/euroveloRoutes/6.gpx'),
  '6-developed': require('../../../../assets/euroveloRoutes/6-developed.gpx'),
  '7': require('../../../../assets/euroveloRoutes/7.gpx'),
  '7-developed': require('../../../../assets/euroveloRoutes/7-developed.gpx'),
  '8': require('../../../../assets/euroveloRoutes/8.gpx'),
  '8-developed': require('../../../../assets/euroveloRoutes/8-developed.gpx'),
  '9': require('../../../../assets/euroveloRoutes/9.gpx'),
  '9-developed': require('../../../../assets/euroveloRoutes/9-developed.gpx'),
  '10': require('../../../../assets/euroveloRoutes/10.gpx'),
  '10-developed': require('../../../../assets/euroveloRoutes/10-developed.gpx'),
  '11': require('../../../../assets/euroveloRoutes/11.gpx'),
  '11-developed': require('../../../../assets/euroveloRoutes/11-developed.gpx'),
  '12': require('../../../../assets/euroveloRoutes/12.gpx'),
  '12-developed': require('../../../../assets/euroveloRoutes/12-developed.gpx'),
  '13': require('../../../../assets/euroveloRoutes/13.gpx'),
  '13-developed': require('../../../../assets/euroveloRoutes/13-developed.gpx'),
  '14': require('../../../../assets/euroveloRoutes/14.gpx'),
  '14-developed': require('../../../../assets/euroveloRoutes/14-developed.gpx'),
  '15': require('../../../../assets/euroveloRoutes/15.gpx'),
  '15-developed': require('../../../../assets/euroveloRoutes/15-developed.gpx'),
  '17': require('../../../../assets/euroveloRoutes/17.gpx'),
  '17-developed': require('../../../../assets/euroveloRoutes/17-developed.gpx'),
  '19': require('../../../../assets/euroveloRoutes/19.gpx'),
  '19-developed': require('../../../../assets/euroveloRoutes/19-developed.gpx'),
};

// Load a single GPX file content using new Expo SDK 54 File API
async function loadGPXContent(fileKey: string): Promise<string | null> {
  try {
    const asset = Asset.fromModule(GPX_ASSETS[fileKey]);
    await asset.downloadAsync();

    if (asset.localUri) {
      const file = new File(asset.localUri);
      const content = await file.text();
      return content;
    }
    return null;
  } catch (error) {
    logger.warn('filesystem', `Failed to load GPX for ${fileKey}`, error);
    return null;
  }
}

/**
 * Load and parse a single route with caching support
 * First checks SQLite cache, falls back to parsing GPX if needed
 */
export async function loadRoute(
  euroVeloId: number,
  variant: RouteVariant
): Promise<ParsedRoute | null> {
  const fileKey = variant === 'developed' ? `${euroVeloId}-developed` : `${euroVeloId}`;
  const routeId = `ev${euroVeloId}-${variant}`;

  if (!GPX_ASSETS[fileKey]) {
    return null;
  }

  // Load GPX content to compute hash for cache validation
  const gpxContent = await loadGPXContent(fileKey);
  if (!gpxContent) {
    return null;
  }

  const gpxHash = computeGPXHash(gpxContent);
  const colors = ROUTE_COLORS[euroVeloId];
  const color = variant === 'developed' ? colors.developed : colors.full;

  try {
    // Check if we have a valid cached version
    const isCached = await routeCacheRepository.isCached(routeId, gpxHash);

    if (isCached) {
      // Return from cache
      const cachedRoute = await routeCacheRepository.getCachedRoute(routeId);
      if (cachedRoute) {
        // Add color (not stored in cache)
        return {
          ...cachedRoute,
          color,
          name: `EV${euroVeloId} - ${ROUTE_NAMES[euroVeloId]}${variant === 'developed' ? ' (Developed)' : ''}`,
        };
      }
    }

    // Parse GPX and cache the result
    const gpxData = parseGPX(gpxContent);
    const route = gpxToRoute(gpxData, routeId);

    const parsedRoute: ParsedRoute = {
      ...route,
      euroVeloId,
      variant,
      name: `EV${euroVeloId} - ${ROUTE_NAMES[euroVeloId]}${variant === 'developed' ? ' (Developed)' : ''}`,
      color,
    };

    // Cache the parsed route (async, don't block return)
    routeCacheRepository.cacheRoute(parsedRoute, gpxHash).catch((error) => {
      logger.warn('cache', `Failed to cache route ${routeId}`, error);
    });

    return parsedRoute;
  } catch (error) {
    logger.error('filesystem', `Failed to parse GPX for EV${euroVeloId} ${variant}`, error);
    return null;
  }
}

/**
 * Load route from cache only (for faster initial loads)
 * Returns null if not cached
 */
export async function loadRouteFromCache(
  euroVeloId: number,
  variant: RouteVariant
): Promise<ParsedRoute | null> {
  const routeId = `ev${euroVeloId}-${variant}`;
  const colors = ROUTE_COLORS[euroVeloId];
  const color = variant === 'developed' ? colors.developed : colors.full;

  try {
    const cachedRoute = await routeCacheRepository.getCachedRoute(routeId);
    if (cachedRoute) {
      return {
        ...cachedRoute,
        color,
        name: `EV${euroVeloId} - ${ROUTE_NAMES[euroVeloId]}${variant === 'developed' ? ' (Developed)' : ''}`,
      };
    }
    return null;
  } catch (error) {
    logger.warn('cache', `Failed to load cached route ${routeId}`, error);
    return null;
  }
}

// Load all available routes
export async function loadAllRoutes(): Promise<ParsedRoute[]> {
  const routes: ParsedRoute[] = [];

  for (const euroVeloId of EUROVELO_ROUTE_IDS) {
    // Load full route
    const fullRoute = await loadRoute(euroVeloId, 'full');
    if (fullRoute) {
      routes.push(fullRoute);
    }

    // Load developed route if available
    if (ROUTES_WITH_DEVELOPED.includes(euroVeloId)) {
      const developedRoute = await loadRoute(euroVeloId, 'developed');
      if (developedRoute) {
        routes.push(developedRoute);
      }
    }
  }

  return routes;
}

// Get color for a route
export function getRouteColor(euroVeloId: number, variant: RouteVariant): string {
  const colors = ROUTE_COLORS[euroVeloId];
  return variant === 'developed' ? colors.developed : colors.full;
}

// Get route name
export function getRouteName(euroVeloId: number): string {
  return ROUTE_NAMES[euroVeloId] || `EuroVelo ${euroVeloId}`;
}

// Check if route has developed version
export function hasDevelopedVersion(euroVeloId: number): boolean {
  return ROUTES_WITH_DEVELOPED.includes(euroVeloId);
}

// Get list of available route IDs
export function getAvailableRouteIds(): number[] {
  return EUROVELO_ROUTE_IDS;
}

// Legacy exports for compatibility
export const ROUTE_CONFIGS: EuroVeloRoute[] = EUROVELO_ROUTE_IDS.map((id) => ({
  id: `ev${id}`,
  euroVeloId: id,
  name: ROUTE_NAMES[id],
  description: '',
  distance: 0,
  countries: [],
  color: ROUTE_COLORS[id].developed,
  difficulty: 'moderate' as const,
  surface: [],
  highlights: [],
  bestSeason: [],
  enabled: true,
}));

export function getRouteConfig(routeId: string): EuroVeloRoute | undefined {
  return ROUTE_CONFIGS.find((r) => r.id === routeId);
}

// Get route metadata for UI display
export function getRouteMetadata(euroVeloId: number): { distance: string; countries: number } {
  return ROUTE_METADATA[euroVeloId] || { distance: 'N/A', countries: 0 };
}
