/**
 * Downloaded Region Model for WatermelonDB
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class DownloadedRegionModel extends Model {
  static table = 'poi_downloaded_regions';

  @text('region_id') regionId!: string;
  @text('name') name!: string;
  @field('center_lat') centerLat!: number;
  @field('center_lon') centerLon!: number;
  @field('radius_km') radiusKm!: number;
  @field('min_lat') minLat!: number;
  @field('max_lat') maxLat!: number;
  @field('min_lon') minLon!: number;
  @field('max_lon') maxLon!: number;
  @field('poi_count') poiCount!: number;
  @field('size_bytes') sizeBytes!: number;
  @field('downloaded_at') downloadedAt!: number;
  @text('categories_json') categoriesJson!: string;

  get categories(): string[] {
    try {
      return JSON.parse(this.categoriesJson || '[]');
    } catch {
      return [];
    }
  }
}
