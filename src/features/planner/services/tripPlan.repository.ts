/**
 * TripPlan Repository using WatermelonDB
 * Handles persistence and queries for trip plans
 */
import { Q } from '@nozbe/watermelondb';
import {
  database,
  tripPlansCollection,
} from '../../../shared/database/watermelon/database';
import TripPlanModel from '../../../shared/database/watermelon/models/TripPlanModel';
import { EuroVeloTripPlan, DayPlan } from '../types';

/**
 * Convert WatermelonDB TripPlan model to EuroVeloTripPlan type
 */
function modelToTripPlan(model: TripPlanModel): EuroVeloTripPlan {
  return {
    id: model.id,
    name: model.name,
    euroVeloId: model.euroVeloId || 0,
    variant: (model.variant as EuroVeloTripPlan['variant']) || 'full',
    startDate: model.startDate,
    endDate: model.endDate || undefined,
    dailyDistanceKm: model.dailyDistanceKm,
    totalDistanceKm: model.totalDistanceKm,
    estimatedDays: model.estimatedDays,
    status: model.status as EuroVeloTripPlan['status'],
    dayPlans: model.dayPlans,
    createdAt: new Date(model.createdAt).toISOString(),
    updatedAt: new Date(model.updatedAt).toISOString(),
  };
}

/**
 * WatermelonDB TripPlan Repository
 */
export const tripPlanRepository = {
  /**
   * Create a new trip plan
   */
  async createTripPlan(tripPlan: EuroVeloTripPlan): Promise<EuroVeloTripPlan> {
    const now = Date.now();

    let created: TripPlanModel | null = null;

    await database.write(async () => {
      created = await tripPlansCollection.create((record) => {
        record._raw.id = tripPlan.id; // Use the existing ID from the trip plan
        record.name = tripPlan.name;
        record.euroVeloId = tripPlan.euroVeloId || null;
        record.routeId = tripPlan.dayPlans[0]?.routeId || null;
        record.variant = tripPlan.variant || null;
        record.startDate = tripPlan.startDate;
        record.endDate = tripPlan.endDate || null;
        record.dailyDistanceKm = tripPlan.dailyDistanceKm;
        record.totalDistanceKm = tripPlan.totalDistanceKm;
        record.estimatedDays = tripPlan.estimatedDays;
        record.status = tripPlan.status;
        record.dayPlansJson = JSON.stringify(tripPlan.dayPlans);
        record.createdAt = now;
        record.updatedAt = now;
      });
    });

    if (!created) {
      throw new Error('Failed to create trip plan');
    }

    return modelToTripPlan(created);
  },

  /**
   * Update an existing trip plan
   */
  async updateTripPlan(
    id: string,
    updates: Partial<EuroVeloTripPlan>
  ): Promise<EuroVeloTripPlan | null> {
    const now = Date.now();

    const tripPlans = await tripPlansCollection.query(Q.where('id', id)).fetch();

    if (tripPlans.length === 0) {
      return null;
    }

    const tripPlan = tripPlans[0];

    await database.write(async () => {
      await tripPlan.update((record) => {
        if (updates.name !== undefined) record.name = updates.name;
        if (updates.euroVeloId !== undefined) record.euroVeloId = updates.euroVeloId;
        if (updates.variant !== undefined) record.variant = updates.variant;
        if (updates.startDate !== undefined) record.startDate = updates.startDate;
        if (updates.endDate !== undefined) record.endDate = updates.endDate || null;
        if (updates.dailyDistanceKm !== undefined) record.dailyDistanceKm = updates.dailyDistanceKm;
        if (updates.totalDistanceKm !== undefined) record.totalDistanceKm = updates.totalDistanceKm;
        if (updates.estimatedDays !== undefined) record.estimatedDays = updates.estimatedDays;
        if (updates.status !== undefined) record.status = updates.status;
        if (updates.dayPlans !== undefined) record.dayPlansJson = JSON.stringify(updates.dayPlans);
        record.updatedAt = now;
      });
    });

    return modelToTripPlan(tripPlan);
  },

  /**
   * Delete a trip plan
   */
  async deleteTripPlan(id: string): Promise<boolean> {
    const tripPlans = await tripPlansCollection.query(Q.where('id', id)).fetch();

    if (tripPlans.length === 0) {
      return false;
    }

    await database.write(async () => {
      await tripPlans[0].destroyPermanently();
    });

    return true;
  },

  /**
   * Get all trip plans
   */
  async getAllTripPlans(): Promise<EuroVeloTripPlan[]> {
    const tripPlans = await tripPlansCollection.query().fetch();
    return tripPlans.map(modelToTripPlan);
  },

  /**
   * Get a trip plan by ID
   */
  async getTripPlanById(id: string): Promise<EuroVeloTripPlan | null> {
    const tripPlans = await tripPlansCollection.query(Q.where('id', id)).fetch();

    if (tripPlans.length === 0) {
      return null;
    }

    return modelToTripPlan(tripPlans[0]);
  },

  /**
   * Get trip plans by status
   */
  async getTripPlansByStatus(status: EuroVeloTripPlan['status']): Promise<EuroVeloTripPlan[]> {
    const tripPlans = await tripPlansCollection
      .query(Q.where('status', status))
      .fetch();

    return tripPlans.map(modelToTripPlan);
  },

  /**
   * Get the most recent active trip plan
   */
  async getActiveTripPlan(): Promise<EuroVeloTripPlan | null> {
    const tripPlans = await tripPlansCollection
      .query(
        Q.where('status', 'active'),
        Q.sortBy('updated_at', Q.desc),
        Q.take(1)
      )
      .fetch();

    if (tripPlans.length === 0) {
      return null;
    }

    return modelToTripPlan(tripPlans[0]);
  },
};
