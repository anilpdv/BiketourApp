/**
 * Expense Model for WatermelonDB
 * Tracks trip expenses by category
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date } from '@nozbe/watermelondb/decorators';

export default class ExpenseModel extends Model {
  static table = 'expenses';

  @text('trip_plan_id') tripPlanId!: string;
  @text('day_plan_id') dayPlanId!: string | null;
  @text('date') date!: string;
  @field('amount') amount!: number;
  @text('currency') currency!: string;
  @text('category') category!: string;
  @text('description') description!: string | null;
  @text('country') country!: string | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
