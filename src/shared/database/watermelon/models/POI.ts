/**
 * POI Model for WatermelonDB
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class POIModel extends Model {
  static table = 'pois';

  @text('poi_id') poiId!: string;
  @text('type') type!: string;
  @text('category') category!: string;
  @text('name') name!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @text('tags_json') tagsJson!: string;
  @field('fetched_at') fetchedAt!: number;
  @field('expires_at') expiresAt!: number;
  @field('is_downloaded') isDownloaded!: boolean;

  get tags(): Record<string, string> {
    try {
      return JSON.parse(this.tagsJson || '{}');
    } catch {
      return {};
    }
  }
}
