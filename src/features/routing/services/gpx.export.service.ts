import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CustomRoute, Waypoint, Coordinate } from '../types';
import { logger } from '../../../shared/utils';

/**
 * Generate GPX XML string from a custom route
 */
export function routeToGPX(route: CustomRoute): string {
  const now = new Date().toISOString();

  // Escape XML special characters
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Generate waypoints XML
  const waypointsXml = route.waypoints
    .map((wp) => {
      const name = wp.name ? `<name>${escapeXml(wp.name)}</name>` : '';
      const desc = `<desc>${escapeXml(wp.type)} waypoint</desc>`;
      const sym = wp.type === 'start' ? '<sym>Flag, Green</sym>' :
                  wp.type === 'end' ? '<sym>Flag, Red</sym>' :
                  '<sym>Waypoint</sym>';
      return `  <wpt lat="${wp.latitude}" lon="${wp.longitude}">
    ${name}
    ${desc}
    ${sym}
  </wpt>`;
    })
    .join('\n');

  // Generate track points XML
  const trackPointsXml = route.geometry
    .map((coord) => `      <trkpt lat="${coord.latitude}" lon="${coord.longitude}"/>`)
    .join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="BikeTourEurope"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(route.name)}</name>
    ${route.description ? `<desc>${escapeXml(route.description)}</desc>` : ''}
    <time>${now}</time>
    <keywords>bike, cycling, tour, ${escapeXml(route.mode)}</keywords>
  </metadata>
${waypointsXml}
  <trk>
    <name>${escapeXml(route.name)}</name>
    <type>${escapeXml(route.mode)}</type>
    <trkseg>
${trackPointsXml}
    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

/**
 * Export a route to a GPX file and share it
 */
export async function exportAndShare(route: CustomRoute): Promise<boolean> {
  try {
    // Generate GPX content
    const gpxContent = routeToGPX(route);

    // Create filename (sanitize route name)
    const sanitizedName = route.name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const filename = `${sanitizedName}_${Date.now()}.gpx`;

    // Write to file system
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, gpxContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('filesystem', 'Sharing is not available on this device');
      return false;
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/gpx+xml',
      dialogTitle: `Export ${route.name}`,
      UTI: 'com.topografix.gpx', // iOS UTI for GPX files
    });

    // Clean up temp file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
    }, 60000); // 1 minute delay

    return true;
  } catch (error) {
    logger.error('filesystem', 'GPX export failed', error);
    return false;
  }
}

/**
 * Save GPX to downloads folder (if available)
 */
export async function saveToFile(route: CustomRoute): Promise<string | null> {
  try {
    const gpxContent = routeToGPX(route);

    const sanitizedName = route.name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const filename = `${sanitizedName}_${Date.now()}.gpx`;

    // Save to document directory (persistent)
    const fileUri = `${FileSystem.documentDirectory}gpx/${filename}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}gpx/`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}gpx/`, {
        intermediates: true,
      });
    }

    await FileSystem.writeAsStringAsync(fileUri, gpxContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  } catch (error) {
    logger.error('filesystem', 'GPX save failed', error);
    return null;
  }
}

/**
 * Get all saved GPX files
 */
export async function getSavedGPXFiles(): Promise<string[]> {
  try {
    const dirUri = `${FileSystem.documentDirectory}gpx/`;
    const dirInfo = await FileSystem.getInfoAsync(dirUri);

    if (!dirInfo.exists) {
      return [];
    }

    const files = await FileSystem.readDirectoryAsync(dirUri);
    return files.filter((f) => f.endsWith('.gpx')).map((f) => `${dirUri}${f}`);
  } catch (error) {
    logger.error('filesystem', 'Failed to list GPX files', error);
    return [];
  }
}

/**
 * Delete a saved GPX file
 */
export async function deleteGPXFile(fileUri: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    return true;
  } catch (error) {
    logger.error('filesystem', 'Failed to delete GPX file', error);
    return false;
  }
}
