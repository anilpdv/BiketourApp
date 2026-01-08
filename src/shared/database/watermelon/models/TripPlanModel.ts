/**
 * TripPlan Model for WatermelonDB
 * Persists trip plans with day plan data
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import { DayPlan } from '../../../../features/planner/types';

export default class TripPlanModel extends Model {
  static table = 'trip_plans';

  @text('name') name!: string;
  @field('euro_velo_id') euroVeloId!: number | null;
  @text('route_id') routeId!: string | null;
  @text('variant') variant!: string | null;
  @text('start_date') startDate!: string;
  @text('end_date') endDate!: string | null;
  @field('daily_distance_km') dailyDistanceKm!: number;
  @field('total_distance_km') totalDistanceKm!: number;
  @field('estimated_days') estimatedDays!: number;
  @text('status') status!: string;
  @text('day_plans_json') dayPlansJson!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  get dayPlans(): DayPlan[] {
    try {
      return JSON.parse(this.dayPlansJson || '[]');
    } catch {
      return [];
    }
  }
}
