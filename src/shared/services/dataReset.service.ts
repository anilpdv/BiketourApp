/**
 * Data Reset Service
 * Centralized service to clear all app data for testing/reset purposes
 */

import * as FileSystem from 'expo-file-system/legacy';
import { databaseService } from '../database/database.service';
import {
  database,
  poisCollection,
  favoritesCollection,
  tilesCollection,
  regionsCollection,
} from '../database/watermelon/database';
import { usePOIStore } from '../../features/pois/store/poiStore';
import { useDownloadedRegionsStore } from '../../features/offline/store/downloadedRegionsStore';
import { logger } from '../utils';

export interface DataResetResult {
  success: boolean;
  errors: string[];
  clearedItems: {
    sqliteTables: number;
    watermelonRecords: number;
    gpxFilesDeleted: number;
  };
}

export interface DeleteProgress {
  phase: 'counting' | 'watermelon' | 'sqlite' | 'files' | 'stores' | 'complete';
  progress: number; // 0-100
  message: string;
}

/**
 * Delete all app data across all storage layers
 * @param onProgress Optional callback for progress updates
 */
export async function deleteAllAppData(
  onProgress?: (progress: DeleteProgress) => void
): Promise<DataResetResult> {
  const errors: string[] = [];
  const clearedItems = {
    sqliteTables: 0,
    watermelonRecords: 0,
    gpxFilesDeleted: 0,
  };

  // 1. Clear WatermelonDB (async, native thread) - this is the slow part
  try {
    const deletedCount = await clearWatermelonDB((deleted, total) => {
      const progress = total > 0 ? Math.round((deleted / total) * 80) : 0; // 0-80% for WatermelonDB
      onProgress?.({
        phase: 'watermelon',
        progress,
        message: `Deleting records... ${deleted.toLocaleString()} / ${total.toLocaleString()}`,
      });
    });
    clearedItems.watermelonRecords = deletedCount;
    logger.info('database', `Cleared ${deletedCount} WatermelonDB records`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`WatermelonDB: ${message}`);
    logger.error('database', 'Failed to clear WatermelonDB', error);
  }

  // 2. Clear Main SQLite Database (all tables)
  onProgress?.({ phase: 'sqlite', progress: 90, message: 'Clearing database...' });
  try {
    await databaseService.deleteAllData();
    clearedItems.sqliteTables = 12; // All 12 data tables cleared
    logger.info('database', 'Cleared SQLite database');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`SQLite database: ${message}`);
    logger.error('database', 'Failed to clear SQLite database', error);
  }

  // 3. Delete GPX files from document directory
  onProgress?.({ phase: 'files', progress: 95, message: 'Deleting files...' });
  try {
    const deletedCount = await clearGPXFiles();
    clearedItems.gpxFilesDeleted = deletedCount;
    if (deletedCount > 0) {
      logger.info('database', `Deleted ${deletedCount} GPX files`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`GPX files: ${message}`);
    logger.error('database', 'Failed to delete GPX files', error);
  }

  // 4. Reset Zustand stores (immediate in-memory state reset)
  onProgress?.({ phase: 'stores', progress: 98, message: 'Resetting app state...' });
  try {
    resetZustandStores();
    logger.info('database', 'Reset Zustand stores');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Zustand stores: ${message}`);
    logger.error('database', 'Failed to reset Zustand stores', error);
  }

  onProgress?.({ phase: 'complete', progress: 100, message: 'Complete!' });

  return {
    success: errors.length === 0,
    errors,
    clearedItems,
  };
}

/**
 * Clear all WatermelonDB tables using chunked batch delete
 * Processes in chunks to avoid stack overflow with large datasets (360K+ records)
 * @param onProgress Callback with (deleted, total) counts
 */
async function clearWatermelonDB(
  onProgress?: (deleted: number, total: number) => void
): Promise<number> {
  const BATCH_SIZE = 5000;
  let deletedCount = 0;

  // Process each collection separately to avoid memory issues
  const collections = [
    favoritesCollection,
    tilesCollection,
    regionsCollection,
    poisCollection, // Largest collection - process last
  ];

  // Count total records first for progress reporting
  let totalRecords = 0;
  for (const collection of collections) {
    totalRecords += await collection.query().fetchCount();
  }

  onProgress?.(0, totalRecords);

  for (const collection of collections) {
    const allRecords = await collection.query().fetch();

    // Delete in chunks to avoid stack overflow
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const chunk = allRecords.slice(i, i + BATCH_SIZE);

      await database.write(async () => {
        const deleteOps = chunk.map((r) => r.prepareDestroyPermanently());
        await database.batch(deleteOps);
      });

      deletedCount += chunk.length;
      onProgress?.(deletedCount, totalRecords);
    }
  }

  return deletedCount;
}

/**
 * Delete all GPX files from document directory
 */
async function clearGPXFiles(): Promise<number> {
  const gpxDir = `${FileSystem.documentDirectory}gpx/`;

  const dirInfo = await FileSystem.getInfoAsync(gpxDir);
  if (!dirInfo.exists) {
    return 0;
  }

  const files = await FileSystem.readDirectoryAsync(gpxDir);
  const gpxFiles = files.filter((f) => f.endsWith('.gpx'));

  for (const file of gpxFiles) {
    await FileSystem.deleteAsync(`${gpxDir}${file}`, { idempotent: true });
  }

  return gpxFiles.length;
}

/**
 * Reset Zustand stores to reflect empty state
 */
function resetZustandStores(): void {
  // Clear POI store
  usePOIStore.getState().clearPOIs();

  // Reload downloaded regions store (will now be empty)
  useDownloadedRegionsStore.getState().loadDownloadedRegions();
}
