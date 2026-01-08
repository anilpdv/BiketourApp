import { ParsedRoute, RoutePoint, RouteVariant } from '../../routes/types';
import { DayPlan, EuroVeloSegment, EuroVeloTripPlan, RouteSource, TripPlan } from '../types';

/**
 * Generate a unique ID for entities
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Find the point on a route closest to a given distance
 */
export function findPointAtDistance(
  points: RoutePoint[],
  targetKm: number
): { latitude: number; longitude: number } {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  // Find the point closest to the target distance
  for (const point of points) {
    const distanceFromStart = point.distanceFromStart ?? 0;
    if (distanceFromStart >= targetKm) {
      return {
        latitude: point.latitude,
        longitude: point.longitude,
      };
    }
  }

  // If we've gone past all points, return the last one
  const lastPoint = points[points.length - 1];
  return {
    latitude: lastPoint.latitude,
    longitude: lastPoint.longitude,
  };
}

/**
 * Split a EuroVelo route into daily segments based on target daily distance
 */
export function splitRouteIntoDays(
  route: ParsedRoute,
  dailyDistanceKm: number,
  startDate: string
): DayPlan[] {
  const plans: DayPlan[] = [];
  const allPoints = route.points;

  if (allPoints.length === 0) {
    return plans;
  }

  let currentKm = 0;
  let dayIndex = 0;
  const now = new Date().toISOString();

  while (currentKm < route.totalDistance) {
    const endKm = Math.min(currentKm + dailyDistanceKm, route.totalDistance);
    const date = formatDate(addDays(new Date(startDate), dayIndex));

    // Find start and end points on route
    const startPoint = findPointAtDistance(allPoints, currentKm);
    const endPoint = findPointAtDistance(allPoints, endKm);

    const segment: EuroVeloSegment = {
      routeId: route.id,
      euroVeloId: route.euroVeloId,
      variant: route.variant,
      startKm: currentKm,
      endKm,
      distanceKm: endKm - currentKm,
      startPoint,
      endPoint,
    };

    plans.push({
      id: generateId(),
      date,
      routeId: route.id,
      startKm: currentKm,
      targetKm: endKm - currentKm,
      actualKm: null,
      status: 'planned',
      notes: '',
      euroVeloSegment: segment,
      createdAt: now,
      updatedAt: now,
    });

    currentKm = endKm;
    dayIndex++;
  }

  return plans;
}

/**
 * Create a complete trip plan for a EuroVelo route
 */
export function createEuroVeloTripPlan(
  route: ParsedRoute,
  startDate: string,
  dailyDistanceKm: number = 80,
  name?: string
): EuroVeloTripPlan {
  const dayPlans = splitRouteIntoDays(route, dailyDistanceKm, startDate);
  const now = new Date().toISOString();

  // Calculate end date
  const lastDayPlan = dayPlans[dayPlans.length - 1];
  const endDate = lastDayPlan?.date;

  return {
    id: generateId(),
    name: name || `${route.name} Trip`,
    euroVeloId: route.euroVeloId,
    variant: route.variant,
    startDate,
    endDate,
    dailyDistanceKm,
    dayPlans,
    totalDistanceKm: route.totalDistance,
    estimatedDays: dayPlans.length,
    status: 'planning',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a trip plan from any route type (EuroVelo, custom, or imported)
 * This is the universal function that supports all route sources
 */
export function createTripPlanFromRoute(
  route: ParsedRoute,
  routeSource: RouteSource,
  startDate: string,
  dailyDistanceKm: number = 80,
  name?: string
): TripPlan {
  const dayPlans = splitRouteIntoDays(route, dailyDistanceKm, startDate);
  const now = new Date().toISOString();

  // Calculate end date
  const lastDayPlan = dayPlans[dayPlans.length - 1];
  const endDate = lastDayPlan?.date;

  // Determine default name based on route source
  let defaultName = `${route.name} Trip`;
  if (routeSource.type === 'custom') {
    defaultName = `${route.name} Trip`;
  } else if (routeSource.type === 'imported') {
    defaultName = `${routeSource.name} Trip`;
  }

  return {
    id: generateId(),
    name: name || defaultName,
    // Legacy fields for backwards compatibility
    euroVeloId: routeSource.type === 'eurovelo' ? routeSource.euroVeloId : 0,
    variant: routeSource.type === 'eurovelo' ? routeSource.variant : 'full',
    // New route source field
    routeSource,
    startDate,
    endDate,
    dailyDistanceKm,
    dayPlans,
    totalDistanceKm: route.totalDistance,
    estimatedDays: dayPlans.length,
    status: 'planning',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate estimated completion stats for a trip
 */
export function calculateTripStats(tripPlan: EuroVeloTripPlan): {
  completedKm: number;
  remainingKm: number;
  completedDays: number;
  remainingDays: number;
  progressPercent: number;
} {
  const completedPlans = tripPlan.dayPlans.filter(
    (plan) => plan.status === 'completed'
  );

  const completedKm = completedPlans.reduce(
    (sum, plan) => sum + (plan.actualKm ?? plan.targetKm),
    0
  );

  const remainingKm = tripPlan.totalDistanceKm - completedKm;
  const completedDays = completedPlans.length;
  const remainingDays = tripPlan.dayPlans.length - completedDays;
  const progressPercent = (completedKm / tripPlan.totalDistanceKm) * 100;

  return {
    completedKm,
    remainingKm,
    completedDays,
    remainingDays,
    progressPercent,
  };
}

/**
 * Adjust remaining day plans based on actual progress
 * If a rider completed more or less than planned, redistribute remaining distance
 */
export function adjustRemainingPlans(
  tripPlan: EuroVeloTripPlan,
  fromDayIndex: number
): DayPlan[] {
  const completedPlans = tripPlan.dayPlans.slice(0, fromDayIndex + 1);
  const remainingPlans = tripPlan.dayPlans.slice(fromDayIndex + 1);

  if (remainingPlans.length === 0) {
    return tripPlan.dayPlans;
  }

  // Calculate completed distance
  const completedKm = completedPlans.reduce(
    (sum, plan) => sum + (plan.actualKm ?? plan.targetKm),
    0
  );

  // Calculate remaining distance
  const remainingKm = tripPlan.totalDistanceKm - completedKm;

  if (remainingKm <= 0) {
    // Trip is complete, mark remaining plans as skipped
    return [
      ...completedPlans,
      ...remainingPlans.map((plan) => ({
        ...plan,
        status: 'skipped' as const,
        notes: plan.notes || 'Route completed ahead of schedule',
      })),
    ];
  }

  // Redistribute remaining distance across remaining days
  const newDailyKm = remainingKm / remainingPlans.length;
  let currentKm = completedKm;

  const adjustedPlans: DayPlan[] = remainingPlans.map((plan, index) => {
    const endKm = Math.min(currentKm + newDailyKm, tripPlan.totalDistanceKm);
    const segment = plan.euroVeloSegment;

    const updatedPlan: DayPlan = {
      ...plan,
      startKm: currentKm,
      targetKm: endKm - currentKm,
      updatedAt: new Date().toISOString(),
    };

    if (segment) {
      updatedPlan.euroVeloSegment = {
        ...segment,
        startKm: currentKm,
        endKm,
        distanceKm: endKm - currentKm,
      };
    }

    currentKm = endKm;
    return updatedPlan;
  });

  return [...completedPlans, ...adjustedPlans];
}

/**
 * Get suggested daily distance based on route difficulty
 */
export function getSuggestedDailyDistance(
  difficulty: 'easy' | 'moderate' | 'difficult'
): number {
  switch (difficulty) {
    case 'easy':
      return 100; // Flat terrain, good paths
    case 'moderate':
      return 80; // Some hills, mixed surfaces
    case 'difficult':
      return 60; // Mountainous, challenging terrain
    default:
      return 80;
  }
}

/**
 * Estimate riding time based on distance and difficulty
 */
export function estimateRidingTime(
  distanceKm: number,
  difficulty: 'easy' | 'moderate' | 'difficult'
): number {
  // Average speeds in km/h for each difficulty
  const speeds = {
    easy: 20,
    moderate: 16,
    difficult: 12,
  };

  const speed = speeds[difficulty] || 16;
  return distanceKm / speed; // Returns hours
}
