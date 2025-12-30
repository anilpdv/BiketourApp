import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { XMLParser } from 'fast-xml-parser';
import { CustomRoute, Waypoint, Coordinate, RoutePlanningMode } from '../types';
import { logger } from '../../../shared/utils';

interface GPXData {
  metadata?: {
    name?: string;
    desc?: string;
    time?: string;
  };
  waypoints: Waypoint[];
  tracks: {
    name?: string;
    type?: string;
    segments: Coordinate[][];
  }[];
}

/**
 * Parse GPX string to structured data
 */
export function parseGPX(gpxString: string): GPXData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  const parsed = parser.parse(gpxString);
  const gpx = parsed.gpx;

  if (!gpx) {
    throw new Error('Invalid GPX file: missing gpx root element');
  }

  // Parse metadata
  const metadata = gpx.metadata
    ? {
        name: gpx.metadata.name,
        desc: gpx.metadata.desc,
        time: gpx.metadata.time,
      }
    : undefined;

  // Parse waypoints
  const waypoints: Waypoint[] = [];
  if (gpx.wpt) {
    const wptArray = Array.isArray(gpx.wpt) ? gpx.wpt : [gpx.wpt];
    wptArray.forEach((wpt: any, index: number) => {
      waypoints.push({
        id: `imported-wp-${index}`,
        latitude: wpt['@_lat'],
        longitude: wpt['@_lon'],
        name: wpt.name || undefined,
        type: index === 0 ? 'start' : index === wptArray.length - 1 ? 'end' : 'via',
        order: index,
      });
    });
  }

  // Parse tracks
  const tracks: GPXData['tracks'] = [];
  if (gpx.trk) {
    const trkArray = Array.isArray(gpx.trk) ? gpx.trk : [gpx.trk];

    for (const trk of trkArray) {
      const segments: Coordinate[][] = [];

      if (trk.trkseg) {
        const segArray = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];

        for (const seg of segArray) {
          const points: Coordinate[] = [];

          if (seg.trkpt) {
            const ptArray = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

            for (const pt of ptArray) {
              points.push({
                latitude: pt['@_lat'],
                longitude: pt['@_lon'],
              });
            }
          }

          if (points.length > 0) {
            segments.push(points);
          }
        }
      }

      tracks.push({
        name: trk.name,
        type: trk.type,
        segments,
      });
    }
  }

  return { metadata, waypoints, tracks };
}

/**
 * Convert parsed GPX data to CustomRoute
 */
export function gpxToCustomRoute(
  gpxData: GPXData,
  name?: string
): CustomRoute {
  const now = new Date().toISOString();
  const routeId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get all track points as geometry
  const geometry: Coordinate[] = [];
  for (const track of gpxData.tracks) {
    for (const segment of track.segments) {
      geometry.push(...segment);
    }
  }

  // Use waypoints from GPX or generate from geometry endpoints
  let waypoints = gpxData.waypoints;
  if (waypoints.length === 0 && geometry.length >= 2) {
    waypoints = [
      {
        id: `${routeId}-wp-0`,
        latitude: geometry[0].latitude,
        longitude: geometry[0].longitude,
        type: 'start',
        order: 0,
      },
      {
        id: `${routeId}-wp-1`,
        latitude: geometry[geometry.length - 1].latitude,
        longitude: geometry[geometry.length - 1].longitude,
        type: 'end',
        order: 1,
      },
    ];
  }

  // Calculate total distance
  let distance = 0;
  for (let i = 1; i < geometry.length; i++) {
    const prev = geometry[i - 1];
    const curr = geometry[i];
    const R = 6371000; // Earth's radius in meters
    const dLat = ((curr.latitude - prev.latitude) * Math.PI) / 180;
    const dLon = ((curr.longitude - prev.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prev.latitude * Math.PI) / 180) *
        Math.cos((curr.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance += R * c;
  }

  // Determine mode based on track type or default
  let mode: RoutePlanningMode = 'point-to-point';
  if (gpxData.tracks.length > 0 && gpxData.tracks[0].type) {
    const trackType = gpxData.tracks[0].type.toLowerCase();
    if (trackType.includes('freeform') || trackType.includes('draw')) {
      mode = 'freeform';
    }
  }

  const routeName =
    name ||
    gpxData.metadata?.name ||
    (gpxData.tracks.length > 0 && gpxData.tracks[0].name) ||
    'Imported Route';

  return {
    id: routeId,
    name: routeName,
    description: gpxData.metadata?.desc,
    mode,
    waypoints: waypoints.map((wp, index) => ({
      ...wp,
      id: `${routeId}-wp-${index}`,
    })),
    geometry,
    distance,
    createdAt: gpxData.metadata?.time || now,
    updatedAt: now,
  };
}

/**
 * Pick and import a GPX file
 */
export async function pickAndImportGPX(): Promise<CustomRoute | null> {
  try {
    // Open document picker
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/gpx+xml', 'text/xml', 'application/xml', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      throw new Error('Please select a GPX file');
    }

    // Read file content
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse GPX
    const gpxData = parseGPX(content);

    if (gpxData.tracks.length === 0 || gpxData.tracks[0].segments.length === 0) {
      throw new Error('GPX file contains no track data');
    }

    // Convert to CustomRoute
    const route = gpxToCustomRoute(gpxData);

    // Clean up temp file
    try {
      await FileSystem.deleteAsync(file.uri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }

    return route;
  } catch (error) {
    logger.error('filesystem', 'GPX import error', error);
    throw error;
  }
}

/**
 * Import GPX from a file URI
 */
export async function importFromUri(uri: string, name?: string): Promise<CustomRoute> {
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const gpxData = parseGPX(content);

  if (gpxData.tracks.length === 0 || gpxData.tracks[0].segments.length === 0) {
    throw new Error('GPX file contains no track data');
  }

  return gpxToCustomRoute(gpxData, name);
}
