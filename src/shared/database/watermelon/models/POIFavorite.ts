/**
 * POI Favorite Model for WatermelonDB
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class POIFavoriteModel extends Model {
  static table = 'poi_favorites';

  @text('poi_id') poiId!: string;
  @text('user_note') userNote!: string;
  @field('favorited_at') favoritedAt!: number;
}
