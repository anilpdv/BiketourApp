/**
 * Overpass Query Builder
 * Functions to build Overpass API queries
 */

import { BoundingBox, POICategoryConfig } from '../types';

/**
 * Build Overpass query for a bounding box and single category
 */
export function buildOverpassQuery(bbox: BoundingBox, category: POICategoryConfig): string {
  const { south, west, north, east } = bbox;
  const [key, value] = category.osmQuery.split('=');

  return `
    [out:json][timeout:8];
    (
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    );
    out center;
  `;
}

/**
 * Build query for multiple categories
 * More efficient than multiple single-category queries
 */
export function buildMultiCategoryQuery(
  bbox: BoundingBox,
  categories: POICategoryConfig[]
): string {
  const { south, west, north, east } = bbox;

  const queries = categories
    .map((cat) => {
      const [key, value] = cat.osmQuery.split('=');
      return `
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    `;
    })
    .join('\n');

  return `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center;
  `;
}

/**
 * Build a count query to estimate the number of POIs without fetching full data
 */
export function buildCountQuery(
  bbox: BoundingBox,
  categories: POICategoryConfig[]
): string {
  const { south, west, north, east } = bbox;

  const queries = categories
    .map((cat) => {
      const [key, value] = cat.osmQuery.split('=');
      return `
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    `;
    })
    .join('\n');

  return `
    [out:json][timeout:10];
    (
      ${queries}
    );
    out count;
  `;
}
