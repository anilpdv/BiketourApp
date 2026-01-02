/**
 * Map-related type definitions
 */

/**
 * Map bounds in [longitude, latitude] format (Mapbox convention)
 * Used for viewport calculations and camera positioning
 */
export interface MapBounds {
  ne: [number, number]; // [longitude, latitude] - northeast corner
  sw: [number, number]; // [longitude, latitude] - southwest corner
}
