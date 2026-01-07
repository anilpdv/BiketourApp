/**
 * Tile Cache Service
 * Handles file system operations for storing and retrieving map tiles
 * Uses expo-file-system for cross-platform file operations
 */

import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../../../shared/utils';
import { MapStyleKey } from '../../../shared/config/mapStyles.config';

/**
 * Base directory for tile storage
 */
const TILES_DIRECTORY = `${FileSystem.documentDirectory}tiles/`;

/**
 * Ensure the tiles directory exists
 */
async function ensureTilesDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TILES_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(TILES_DIRECTORY, { intermediates: true });
  }
}

/**
 * Get the file path for a specific tile
 */
export function getTilePath(styleKey: MapStyleKey, z: number, x: number, y: number): string {
  return `${TILES_DIRECTORY}${styleKey}/${z}/${x}/${y}.png`;
}

/**
 * Get the directory path for a specific zoom level
 */
function getZoomDirectory(styleKey: MapStyleKey, z: number): string {
  return `${TILES_DIRECTORY}${styleKey}/${z}/`;
}

/**
 * Get the directory path for a specific x column at a zoom level
 */
function getColumnDirectory(styleKey: MapStyleKey, z: number, x: number): string {
  return `${TILES_DIRECTORY}${styleKey}/${z}/${x}/`;
}

/**
 * Ensure directory structure exists for a tile
 */
async function ensureTileDirectory(styleKey: MapStyleKey, z: number, x: number): Promise<void> {
  const columnDir = getColumnDirectory(styleKey, z, x);
  const info = await FileSystem.getInfoAsync(columnDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(columnDir, { intermediates: true });
  }
}

/**
 * Check if a tile is cached
 */
export async function isTileCached(
  styleKey: MapStyleKey,
  z: number,
  x: number,
  y: number
): Promise<boolean> {
  const tilePath = getTilePath(styleKey, z, x, y);
  const info = await FileSystem.getInfoAsync(tilePath);
  return info.exists;
}

/**
 * Save a tile to the cache
 * @param styleKey - The map style key
 * @param z - Zoom level
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param data - Base64 encoded image data
 */
export async function saveTile(
  styleKey: MapStyleKey,
  z: number,
  x: number,
  y: number,
  data: string
): Promise<void> {
  await ensureTilesDirectory();
  await ensureTileDirectory(styleKey, z, x);

  const tilePath = getTilePath(styleKey, z, x, y);
  await FileSystem.writeAsStringAsync(tilePath, data, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Save a tile from a URL directly to the cache
 * @returns The size of the downloaded tile in bytes
 */
export async function saveTileFromUrl(
  styleKey: MapStyleKey,
  z: number,
  x: number,
  y: number,
  url: string
): Promise<number> {
  await ensureTilesDirectory();
  await ensureTileDirectory(styleKey, z, x);

  const tilePath = getTilePath(styleKey, z, x, y);

  const downloadResult = await FileSystem.downloadAsync(url, tilePath);

  if (downloadResult.status !== 200) {
    throw new Error(`Failed to download tile: HTTP ${downloadResult.status}`);
  }

  // Get the file size
  const fileInfo = await FileSystem.getInfoAsync(tilePath);
  return (fileInfo as any).size || 0;
}

/**
 * Get a cached tile as a file URI
 * @returns The file URI if cached, null otherwise
 */
export async function getTile(
  styleKey: MapStyleKey,
  z: number,
  x: number,
  y: number
): Promise<string | null> {
  const tilePath = getTilePath(styleKey, z, x, y);
  const info = await FileSystem.getInfoAsync(tilePath);

  if (info.exists) {
    return tilePath;
  }

  return null;
}

/**
 * Delete all tiles for a specific style
 */
export async function deleteTilesForStyle(styleKey: MapStyleKey): Promise<void> {
  const styleDir = `${TILES_DIRECTORY}${styleKey}/`;
  const info = await FileSystem.getInfoAsync(styleDir);

  if (info.exists) {
    await FileSystem.deleteAsync(styleDir, { idempotent: true });
    logger.info('offline', `Deleted tile cache for style: ${styleKey}`);
  }
}

/**
 * Delete tiles for a specific region (by bounds and zoom levels)
 * This is more granular than deleting all tiles for a style
 */
export async function deleteTilesInRegion(
  styleKey: MapStyleKey,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZoom: number,
  maxZoom: number
): Promise<number> {
  let deletedCount = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    // Calculate tile bounds at this zoom level
    const scale = Math.pow(2, z - minZoom);
    const zMinX = Math.floor(minX * scale);
    const zMaxX = Math.floor(maxX * scale);
    const zMinY = Math.floor(minY * scale);
    const zMaxY = Math.floor(maxY * scale);

    for (let x = zMinX; x <= zMaxX; x++) {
      for (let y = zMinY; y <= zMaxY; y++) {
        const tilePath = getTilePath(styleKey, z, x, y);
        const info = await FileSystem.getInfoAsync(tilePath);

        if (info.exists) {
          await FileSystem.deleteAsync(tilePath, { idempotent: true });
          deletedCount++;
        }
      }
    }
  }

  logger.info('offline', `Deleted ${deletedCount} tiles for region in style: ${styleKey}`);
  return deletedCount;
}

/**
 * Get the total size of cached tiles for a style
 */
export async function getTileCacheSizeForStyle(styleKey: MapStyleKey): Promise<number> {
  const styleDir = `${TILES_DIRECTORY}${styleKey}/`;
  const info = await FileSystem.getInfoAsync(styleDir);

  if (!info.exists) {
    return 0;
  }

  return await getDirectorySize(styleDir);
}

/**
 * Get the total size of all cached tiles
 */
export async function getTotalTileCacheSize(): Promise<number> {
  const info = await FileSystem.getInfoAsync(TILES_DIRECTORY);

  if (!info.exists) {
    return 0;
  }

  return await getDirectorySize(TILES_DIRECTORY);
}

/**
 * Recursively calculate directory size
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const contents = await FileSystem.readDirectoryAsync(dirPath);

    for (const item of contents) {
      const itemPath = `${dirPath}${item}`;
      const info = await FileSystem.getInfoAsync(itemPath);

      if (info.exists) {
        if (info.isDirectory) {
          totalSize += await getDirectorySize(`${itemPath}/`);
        } else {
          totalSize += (info as any).size || 0;
        }
      }
    }
  } catch (error) {
    logger.warn('offline', 'Error calculating directory size', error);
  }

  return totalSize;
}

/**
 * Clear all cached tiles
 */
export async function clearAllTileCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TILES_DIRECTORY);

  if (info.exists) {
    await FileSystem.deleteAsync(TILES_DIRECTORY, { idempotent: true });
    logger.info('offline', 'Cleared all tile cache');
  }
}

/**
 * Get list of cached styles
 */
export async function getCachedStyles(): Promise<MapStyleKey[]> {
  const info = await FileSystem.getInfoAsync(TILES_DIRECTORY);

  if (!info.exists) {
    return [];
  }

  const contents = await FileSystem.readDirectoryAsync(TILES_DIRECTORY);
  return contents as MapStyleKey[];
}

/**
 * Count cached tiles for a style
 */
export async function countCachedTiles(styleKey: MapStyleKey): Promise<number> {
  const styleDir = `${TILES_DIRECTORY}${styleKey}/`;
  const info = await FileSystem.getInfoAsync(styleDir);

  if (!info.exists) {
    return 0;
  }

  return await countFilesInDirectory(styleDir);
}

/**
 * Recursively count files in a directory
 */
async function countFilesInDirectory(dirPath: string): Promise<number> {
  let count = 0;

  try {
    const contents = await FileSystem.readDirectoryAsync(dirPath);

    for (const item of contents) {
      const itemPath = `${dirPath}${item}`;
      const info = await FileSystem.getInfoAsync(itemPath);

      if (info.exists) {
        if (info.isDirectory) {
          count += await countFilesInDirectory(`${itemPath}/`);
        } else if (item.endsWith('.png')) {
          count++;
        }
      }
    }
  } catch (error) {
    logger.warn('offline', 'Error counting files in directory', error);
  }

  return count;
}
