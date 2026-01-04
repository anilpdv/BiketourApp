/**
 * Tile Grid Utilities
 * Shared tile-based grid logic for POI caching and offline storage
 */

import { BoundingBox } from '../types/geo.types';

// Grid size for tile keys (in degrees) - approximately 22km at equator
// Larger tiles = fewer API calls but slightly more data per call
export const TILE_SIZE = 0.2;

/**
 * Represents a single tile in the grid
 */
export interface Tile {
  south: number;
  north: number;
  west: number;
  east: number;
  key: string;
}

/**
 * Generate a tile key from bounding box coordinates
 * Uses a grid-based approach for consistent caching
 */
export function getTileKey(bbox: BoundingBox): string {
  const minLatTile = Math.floor(bbox.south / TILE_SIZE);
  const maxLatTile = Math.floor(bbox.north / TILE_SIZE);
  const minLonTile = Math.floor(bbox.west / TILE_SIZE);
  const maxLonTile = Math.floor(bbox.east / TILE_SIZE);
  return `${minLatTile}_${maxLatTile}_${minLonTile}_${maxLonTile}`;
}

/**
 * Get all tiles that cover a given bounding box
 * Tiles are aligned to TILE_SIZE grid
 */
export function getTilesCoveringBbox(bbox: BoundingBox): Tile[] {
  const tiles: Tile[] = [];

  const minLatTile = Math.floor(bbox.south / TILE_SIZE) * TILE_SIZE;
  const maxLatTile = Math.ceil(bbox.north / TILE_SIZE) * TILE_SIZE;
  const minLonTile = Math.floor(bbox.west / TILE_SIZE) * TILE_SIZE;
  const maxLonTile = Math.ceil(bbox.east / TILE_SIZE) * TILE_SIZE;

  for (let lat = minLatTile; lat < maxLatTile; lat += TILE_SIZE) {
    for (let lon = minLonTile; lon < maxLonTile; lon += TILE_SIZE) {
      const tile: Tile = {
        south: lat,
        north: lat + TILE_SIZE,
        west: lon,
        east: lon + TILE_SIZE,
        key: getTileKey({ south: lat, north: lat + TILE_SIZE, west: lon, east: lon + TILE_SIZE }),
      };
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Calculate the number of tiles covering a bounding box
 */
export function getTileCount(bbox: BoundingBox): number {
  const latTiles = Math.ceil((bbox.north - bbox.south) / TILE_SIZE);
  const lonTiles = Math.ceil((bbox.east - bbox.west) / TILE_SIZE);
  return latTiles * lonTiles;
}

/**
 * Get the bounding box for a single tile at a given coordinate
 */
export function getTileBbox(lat: number, lon: number): BoundingBox {
  const tileLat = Math.floor(lat / TILE_SIZE) * TILE_SIZE;
  const tileLon = Math.floor(lon / TILE_SIZE) * TILE_SIZE;
  return {
    south: tileLat,
    north: tileLat + TILE_SIZE,
    west: tileLon,
    east: tileLon + TILE_SIZE,
  };
}
