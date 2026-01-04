/**
 * POI Cache Tile Model for WatermelonDB
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class POICacheTileModel extends Model {
  static table = 'poi_cache_tiles';

  @text('tile_key') tileKey!: string;
  @field('min_lat') minLat!: number;
  @field('max_lat') maxLat!: number;
  @field('min_lon') minLon!: number;
  @field('max_lon') maxLon!: number;
  @field('fetched_at') fetchedAt!: number;
  @field('expires_at') expiresAt!: number;
  @text('categories') categories?: string;  // Comma-separated fetched categories (e.g., "campsite,hospital,pharmacy") - nullable for old tiles
}
