/**
 * Shared geographic types used across the application
 */

/**
 * A geographic coordinate with latitude and longitude
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * A bounding box defined by southwest and northeast corners
 */
export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Alternative bounding box format using min/max
 */
export interface BoundingBoxMinMax {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Convert between bounding box formats
 */
export function toBoundingBox(bbox: BoundingBoxMinMax): BoundingBox {
  return {
    south: bbox.minLat,
    west: bbox.minLon,
    north: bbox.maxLat,
    east: bbox.maxLon,
  };
}

export function toBoundingBoxMinMax(bbox: BoundingBox): BoundingBoxMinMax {
  return {
    minLat: bbox.south,
    maxLat: bbox.north,
    minLon: bbox.west,
    maxLon: bbox.east,
  };
}
