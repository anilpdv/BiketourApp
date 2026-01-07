/**
 * Cached Tile Region Model for WatermelonDB
 * Tracks downloaded map tile regions for offline use
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class CachedTileRegionModel extends Model {
  static table = 'cached_tile_regions';

  @text('region_id') regionId!: string;
  @text('style_key') styleKey!: string;
  @text('name') name!: string;
  @field('min_lat') minLat!: number;
  @field('max_lat') maxLat!: number;
  @field('min_lon') minLon!: number;
  @field('max_lon') maxLon!: number;
  @field('min_zoom') minZoom!: number;
  @field('max_zoom') maxZoom!: number;
  @field('tile_count') tileCount!: number;
  @field('size_bytes') sizeBytes!: number;
  @field('downloaded_at') downloadedAt!: number;

  /**
   * Get the bounds as a BoundingBox object
   */
  get bounds() {
    return {
      south: this.minLat,
      north: this.maxLat,
      west: this.minLon,
      east: this.maxLon,
    };
  }
}
