/**
 * Download Bounds Service
 * Utilities for calculating bounds and tiles for POI downloads
 */

import { BoundingBox } from '../../pois/types';

// Grid size for tile-based downloading (0.5 degrees = ~55km at equator)
export const DOWNLOAD_TILE_SIZE = 0.5;

// Larger tiles for bulk downloads - bypasses rate limiter (1.0° ≈ 111km)
export const BULK_DOWNLOAD_TILE_SIZE = 1.0;

// Maximum region size for single-query mode (in degrees)
// Regions smaller than this use ONE API call instead of tile-by-tile
export const SINGLE_QUERY_MAX_SIZE_DEG = 3.0;

/**
 * Calculate bounding box from center point and radius
 */
export function calculateBoundsFromRadius(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): BoundingBox {
  // Earth's radius in km
  const earthRadius = 6371;

  // Calculate latitude offset (same at all longitudes)
  const latOffset = (radiusKm / earthRadius) * (180 / Math.PI);

  // Calculate longitude offset (varies with latitude)
  const lonOffset =
    (radiusKm / (earthRadius * Math.cos((centerLat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    south: centerLat - latOffset,
    north: centerLat + latOffset,
    west: centerLon - lonOffset,
    east: centerLon + lonOffset,
  };
}

/**
 * Get tiles covering a bounding box (standard size)
 */
export function getTilesCoveringBounds(bounds: BoundingBox): BoundingBox[] {
  const tiles: BoundingBox[] = [];

  const minLatTile = Math.floor(bounds.south / DOWNLOAD_TILE_SIZE) * DOWNLOAD_TILE_SIZE;
  const maxLatTile = Math.ceil(bounds.north / DOWNLOAD_TILE_SIZE) * DOWNLOAD_TILE_SIZE;
  const minLonTile = Math.floor(bounds.west / DOWNLOAD_TILE_SIZE) * DOWNLOAD_TILE_SIZE;
  const maxLonTile = Math.ceil(bounds.east / DOWNLOAD_TILE_SIZE) * DOWNLOAD_TILE_SIZE;

  for (let lat = minLatTile; lat < maxLatTile; lat += DOWNLOAD_TILE_SIZE) {
    for (let lon = minLonTile; lon < maxLonTile; lon += DOWNLOAD_TILE_SIZE) {
      tiles.push({
        south: lat,
        north: lat + DOWNLOAD_TILE_SIZE,
        west: lon,
        east: lon + DOWNLOAD_TILE_SIZE,
      });
    }
  }

  return tiles;
}

/**
 * Get larger tiles for bulk downloads
 * Fewer, larger tiles = fewer API calls = faster downloads
 */
export function getTilesCoveringBoundsForDownload(bounds: BoundingBox): BoundingBox[] {
  const tiles: BoundingBox[] = [];
  const tileSize = BULK_DOWNLOAD_TILE_SIZE;

  const minLat = Math.floor(bounds.south / tileSize) * tileSize;
  const maxLat = Math.ceil(bounds.north / tileSize) * tileSize;
  const minLon = Math.floor(bounds.west / tileSize) * tileSize;
  const maxLon = Math.ceil(bounds.east / tileSize) * tileSize;

  for (let lat = minLat; lat < maxLat; lat += tileSize) {
    for (let lon = minLon; lon < maxLon; lon += tileSize) {
      tiles.push({
        south: lat,
        north: lat + tileSize,
        west: lon,
        east: lon + tileSize,
      });
    }
  }

  return tiles;
}

/**
 * Check if a region is small enough for single-query mode
 */
export function shouldUseSingleQueryMode(bounds: BoundingBox): boolean {
  const regionWidth = bounds.east - bounds.west;
  const regionHeight = bounds.north - bounds.south;
  return regionWidth < SINGLE_QUERY_MAX_SIZE_DEG && regionHeight < SINGLE_QUERY_MAX_SIZE_DEG;
}

/**
 * Get the approximate size of a region in kilometers
 */
export function getRegionSizeKm(bounds: BoundingBox): { widthKm: number; heightKm: number } {
  const regionWidth = bounds.east - bounds.west;
  const regionHeight = bounds.north - bounds.south;
  // 1 degree ≈ 111km
  return {
    widthKm: Math.round(regionWidth * 111),
    heightKm: Math.round(regionHeight * 111),
  };
}

/**
 * Generate auto-name for region based on coordinates
 */
export function generateRegionName(centerLat: number, centerLon: number): string {
  const latDir = centerLat >= 0 ? 'N' : 'S';
  const lonDir = centerLon >= 0 ? 'E' : 'W';
  return `Area ${Math.abs(centerLat).toFixed(1)}${latDir}, ${Math.abs(centerLon).toFixed(1)}${lonDir}`;
}

/**
 * Generate a unique region ID
 */
export function generateRegionId(): string {
  return `region_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
