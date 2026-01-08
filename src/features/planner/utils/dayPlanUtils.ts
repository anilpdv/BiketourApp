import { DayPlan, DayPlanStatus, EuroVeloSegment } from '../types';

/**
 * Recalculates startKm for all days after a modified day.
 * When a day's targetKm changes, subsequent days need their startKm updated
 * to maintain contiguous km ranges along the route.
 *
 * @param dayPlans - The array of day plans (sorted by date)
 * @param modifiedDayIndex - Index of the day whose targetKm changed
 * @returns Updated array of day plans with recalculated km ranges
 */
export function recalculateSubsequentDays(
  dayPlans: DayPlan[],
  modifiedDayIndex: number
): DayPlan[] {
  if (modifiedDayIndex < 0 || modifiedDayIndex >= dayPlans.length) {
    return dayPlans;
  }

  const result = [...dayPlans];
  const now = new Date().toISOString();

  // Start cascading from the day after the modified day
  let currentEndKm = result[modifiedDayIndex].startKm + result[modifiedDayIndex].targetKm;

  for (let i = modifiedDayIndex + 1; i < result.length; i++) {
    const day = result[i];
    const dayDistance = day.targetKm;

    // Update the day's startKm and segment info
    result[i] = {
      ...day,
      startKm: currentEndKm,
      euroVeloSegment: day.euroVeloSegment
        ? {
            ...day.euroVeloSegment,
            startKm: currentEndKm,
            endKm: currentEndKm + dayDistance,
            distanceKm: dayDistance,
          }
        : undefined,
      updatedAt: now,
    };

    currentEndKm += dayDistance;
  }

  return result;
}

/**
 * Updates a single day's targetKm and recalculates its euroVeloSegment.
 *
 * @param dayPlan - The day plan to update
 * @param newTargetKm - The new target kilometers for this day
 * @returns Updated day plan
 */
export function updateDayTargetKm(dayPlan: DayPlan, newTargetKm: number): DayPlan {
  const now = new Date().toISOString();
  const newEndKm = dayPlan.startKm + newTargetKm;

  return {
    ...dayPlan,
    targetKm: newTargetKm,
    euroVeloSegment: dayPlan.euroVeloSegment
      ? {
          ...dayPlan.euroVeloSegment,
          endKm: newEndKm,
          distanceKm: newTargetKm,
        }
      : undefined,
    updatedAt: now,
  };
}

/**
 * Resorts day plans by date and recalculates km ranges to maintain contiguity.
 * Used when a day's date is changed.
 *
 * @param dayPlans - The array of day plans to resort
 * @returns Sorted array with recalculated km ranges
 */
export function resortDaysByDate(dayPlans: DayPlan[]): DayPlan[] {
  if (dayPlans.length === 0) return dayPlans;

  // Sort by date
  const sorted = [...dayPlans].sort((a, b) => a.date.localeCompare(b.date));

  // Recalculate all km ranges to be contiguous
  const now = new Date().toISOString();
  let currentKm = sorted[0].startKm; // Keep the first day's starting point

  return sorted.map((day, index) => {
    const startKm = index === 0 ? day.startKm : currentKm;
    const endKm = startKm + day.targetKm;

    const updatedDay: DayPlan = {
      ...day,
      startKm,
      euroVeloSegment: day.euroVeloSegment
        ? {
            ...day.euroVeloSegment,
            startKm,
            endKm,
            distanceKm: day.targetKm,
          }
        : undefined,
      updatedAt: now,
    };

    currentKm = endKm;
    return updatedDay;
  });
}

/**
 * Checks if a date conflicts with existing day plans.
 *
 * @param date - The date to check (YYYY-MM-DD format)
 * @param existingDates - Array of existing dates
 * @param excludeDayId - Optional day ID to exclude from conflict check (for editing)
 * @param dayPlans - Optional array of day plans (used with excludeDayId)
 * @returns True if the date conflicts with an existing day
 */
export function hasDateConflict(
  date: string,
  existingDates: string[],
  excludeDayId?: string,
  dayPlans?: DayPlan[]
): boolean {
  // If excluding a day, filter out its date from the check
  let datesToCheck = existingDates;

  if (excludeDayId && dayPlans) {
    const excludedDay = dayPlans.find((d) => d.id === excludeDayId);
    if (excludedDay) {
      datesToCheck = existingDates.filter((d) => d !== excludedDay.date);
    }
  }

  return datesToCheck.includes(date);
}

/**
 * Creates a rest day to be inserted after a specific day.
 *
 * @param afterDayPlan - The day plan after which to insert the rest day
 * @param routeId - The route ID for the rest day
 * @param restDate - The date for the rest day (YYYY-MM-DD format)
 * @returns A new rest day plan
 */
export function createRestDay(
  afterDayPlan: DayPlan,
  routeId: string,
  restDate: string
): DayPlan {
  const now = new Date().toISOString();
  const startKm = afterDayPlan.startKm + afterDayPlan.targetKm;

  return {
    id: generateId(),
    date: restDate,
    routeId,
    startKm,
    targetKm: 0, // Rest day has 0 km target
    actualKm: null,
    status: 'skipped' as DayPlanStatus, // Use 'skipped' status for rest days
    notes: 'Rest day',
    euroVeloSegment: afterDayPlan.euroVeloSegment
      ? {
          ...afterDayPlan.euroVeloSegment,
          startKm,
          endKm: startKm,
          distanceKm: 0,
        }
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generates a unique ID for a new day plan.
 */
function generateId(): string {
  return `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates the next available date after all existing dates.
 *
 * @param existingDates - Array of existing dates (YYYY-MM-DD format)
 * @returns Next available date
 */
export function getNextAvailableDate(existingDates: string[]): string {
  if (existingDates.length === 0) {
    return new Date().toISOString().split('T')[0];
  }

  const sortedDates = [...existingDates].sort();
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  lastDate.setDate(lastDate.getDate() + 1);
  return lastDate.toISOString().split('T')[0];
}

/**
 * Gets the date for a rest day to be inserted after a specific day.
 * Shifts subsequent days' dates forward by one day.
 *
 * @param dayPlans - Array of day plans
 * @param afterIndex - Index of the day after which to insert rest day
 * @returns The date for the new rest day and updated day plans with shifted dates
 */
export function insertRestDayAfter(
  dayPlans: DayPlan[],
  afterIndex: number
): { restDate: string; updatedDayPlans: DayPlan[] } {
  if (afterIndex < 0 || afterIndex >= dayPlans.length) {
    throw new Error('Invalid day index');
  }

  const now = new Date().toISOString();
  const afterDay = dayPlans[afterIndex];

  // Rest day gets the date of the next day
  const afterDate = new Date(afterDay.date);
  afterDate.setDate(afterDate.getDate() + 1);
  const restDate = afterDate.toISOString().split('T')[0];

  // Shift all subsequent days' dates by one day
  const updatedDayPlans = dayPlans.map((day, index) => {
    if (index <= afterIndex) {
      return day; // Days before and including afterDay stay the same
    }

    // Shift date forward by one day
    const currentDate = new Date(day.date);
    currentDate.setDate(currentDate.getDate() + 1);

    return {
      ...day,
      date: currentDate.toISOString().split('T')[0],
      updatedAt: now,
    };
  });

  return { restDate, updatedDayPlans };
}

/**
 * Removes a day plan and recalculates subsequent days.
 *
 * @param dayPlans - Array of day plans
 * @param removeIndex - Index of the day to remove
 * @returns Updated array with the day removed and km ranges recalculated
 */
export function removeDayAndRecalculate(
  dayPlans: DayPlan[],
  removeIndex: number
): DayPlan[] {
  if (removeIndex < 0 || removeIndex >= dayPlans.length) {
    return dayPlans;
  }

  const result = dayPlans.filter((_, index) => index !== removeIndex);

  // If we removed a day, recalculate km ranges starting from that position
  if (removeIndex > 0 && result.length > removeIndex) {
    // Recalculate from the day that's now at removeIndex
    return recalculateSubsequentDays(result, removeIndex - 1);
  } else if (removeIndex === 0 && result.length > 0) {
    // If we removed the first day, recalculate all days
    // Keep the original startKm of what's now the first day
    return result;
  }

  return result;
}

/**
 * Validates that a day plan update won't cause issues.
 *
 * @param dayPlans - Current array of day plans
 * @param updateIndex - Index of the day being updated
 * @param updates - The updates to apply
 * @param totalRouteKm - Total km of the route
 * @returns Validation result with any error message
 */
export function validateDayPlanUpdate(
  dayPlans: DayPlan[],
  updateIndex: number,
  updates: Partial<DayPlan>,
  totalRouteKm: number
): { valid: boolean; error?: string } {
  const day = dayPlans[updateIndex];
  if (!day) {
    return { valid: false, error: 'Day not found' };
  }

  // Check targetKm is valid
  if (updates.targetKm !== undefined) {
    if (updates.targetKm < 0) {
      return { valid: false, error: 'Target km cannot be negative' };
    }

    // Calculate what the end km would be after this change and all subsequent days
    const newEndKm = day.startKm + updates.targetKm;
    let cumulativeKm = newEndKm;

    for (let i = updateIndex + 1; i < dayPlans.length; i++) {
      cumulativeKm += dayPlans[i].targetKm;
    }

    if (cumulativeKm > totalRouteKm * 1.2) {
      // Allow 20% buffer for flexibility
      return {
        valid: false,
        error: 'This change would exceed the total route distance',
      };
    }
  }

  // Check date conflicts
  if (updates.date !== undefined) {
    const existingDates = dayPlans.map((d) => d.date);
    if (hasDateConflict(updates.date, existingDates, day.id, dayPlans)) {
      return { valid: false, error: 'Another day already has this date' };
    }
  }

  return { valid: true };
}

/**
 * Gets all dates from the day plans array.
 *
 * @param dayPlans - Array of day plans
 * @returns Array of dates in YYYY-MM-DD format
 */
export function getDayPlanDates(dayPlans: DayPlan[]): string[] {
  return dayPlans.map((d) => d.date);
}

/**
 * Checks if a day is a rest day (targetKm === 0 or status === 'skipped').
 *
 * @param dayPlan - The day plan to check
 * @returns True if it's a rest day
 */
export function isRestDay(dayPlan: DayPlan): boolean {
  return dayPlan.targetKm === 0 || dayPlan.status === 'skipped';
}

/**
 * Calculates total remaining km after a specific day.
 *
 * @param dayPlans - Array of day plans
 * @param fromIndex - Starting index (inclusive)
 * @returns Total km from this day onwards
 */
export function getRemainingKm(dayPlans: DayPlan[], fromIndex: number): number {
  return dayPlans.slice(fromIndex).reduce((sum, day) => sum + day.targetKm, 0);
}
