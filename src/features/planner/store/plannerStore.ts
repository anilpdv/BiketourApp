import { create } from 'zustand';
import {
  DayPlan,
  DayPlanStatus,
  RouteProgress,
  TripSummary,
  PlannerSettings,
  EuroVeloTripPlan,
  TripPlan,
  RouteSource,
  Expense,
  ExpenseCategory,
  ExpenseSummary,
  BudgetStatus,
} from '../types';
import { calculateBudgetStatus } from '../utils/expenseUtils';
import {
  recalculateSubsequentDays,
  updateDayTargetKm,
  resortDaysByDate,
  hasDateConflict,
  createRestDay,
  insertRestDayAfter,
  removeDayAndRecalculate,
  getDayPlanDates,
} from '../utils/dayPlanUtils';
import { ParsedRoute } from '../../routes/types';
import {
  createEuroVeloTripPlan,
  createTripPlanFromRoute,
  calculateTripStats,
  adjustRemainingPlans,
} from '../services/euroveloPlanningService';
import { expenseRepository } from '../services/expense.repository';
import { tripPlanRepository } from '../services/tripPlan.repository';

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get today's date as ISO string
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface PlannerState {
  // Day plans
  plans: DayPlan[];

  // EuroVelo trip plans
  tripPlans: EuroVeloTripPlan[];
  activeTripPlan: EuroVeloTripPlan | null;

  // Route progress
  routeProgress: Map<string, RouteProgress>;

  // Expenses
  expenses: Expense[];
  expensesLoaded: boolean;

  // Trip plans loaded state
  tripPlansLoaded: boolean;

  // Settings
  settings: PlannerSettings;

  // Selected date for planning
  selectedDate: string;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  addPlan: (plan: Omit<DayPlan, 'id' | 'createdAt' | 'updatedAt'>) => DayPlan;
  updatePlan: (id: string, updates: Partial<DayPlan>) => void;
  deletePlan: (id: string) => void;
  completePlan: (id: string, actualKm: number) => void;
  skipPlan: (id: string) => void;
  setSelectedDate: (date: string) => void;
  updateSettings: (settings: Partial<PlannerSettings>) => void;
  calculateTripSummary: () => TripSummary;
  getPlansForDateRange: (startDate: string, endDate: string) => DayPlan[];
  getPlanForDate: (date: string) => DayPlan | undefined;

  // Trip plan loading
  loadTripPlans: () => Promise<void>;

  // EuroVelo trip planning actions (legacy)
  createTripPlan: (
    route: ParsedRoute,
    startDate: string,
    dailyDistanceKm?: number,
    name?: string
  ) => Promise<EuroVeloTripPlan>;

  // Universal trip planning action (supports any route type)
  createTripPlanFromAnyRoute: (
    route: ParsedRoute,
    routeSource: RouteSource,
    startDate: string,
    dailyDistanceKm?: number,
    name?: string
  ) => Promise<TripPlan>;

  setActiveTripPlan: (tripPlan: EuroVeloTripPlan | null) => void;
  updateTripPlan: (id: string, updates: Partial<EuroVeloTripPlan>) => Promise<void>;
  deleteTripPlan: (id: string) => Promise<void>;
  completeTripDayPlan: (tripId: string, dayPlanId: string, actualKm: number) => Promise<void>;
  getTripPlanStats: (tripId: string) => ReturnType<typeof calculateTripStats> | null;

  // Expense actions
  loadExpenses: (tripPlanId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseSummary: (tripPlanId: string) => Promise<ExpenseSummary>;
  getExpensesForDay: (dayPlanId: string) => Expense[];

  // Budget actions
  updateTripBudget: (tripId: string, budget: number, currency: string) => Promise<void>;
  getBudgetStatus: (tripId: string) => BudgetStatus | null;

  // Day plan editing actions
  updateDayPlan: (
    tripId: string,
    dayPlanId: string,
    updates: Partial<DayPlan>,
    recalculateSubsequent?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  addRestDay: (tripId: string, afterDayPlanId: string) => Promise<{ success: boolean; error?: string }>;
  removeDayPlan: (tripId: string, dayPlanId: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultSettings: PlannerSettings = {
  defaultDailyDistanceKm: 80,
  preferredStartTime: '08:00',
  restDayInterval: 7,
  showWeatherInPlanner: true,
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plans: [],
  tripPlans: [],
  activeTripPlan: null,
  routeProgress: new Map(),
  expenses: [],
  expensesLoaded: false,
  tripPlansLoaded: false,
  settings: defaultSettings,
  selectedDate: getTodayISO(),
  isLoading: false,
  error: null,

  addPlan: (planData) => {
    const now = new Date().toISOString();
    const newPlan: DayPlan = {
      ...planData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      plans: [...state.plans, newPlan],
    }));

    return newPlan;
  },

  updatePlan: (id, updates) => {
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      ),
    }));
  },

  deletePlan: (id) => {
    set((state) => ({
      plans: state.plans.filter((plan) => plan.id !== id),
    }));
  },

  completePlan: (id, actualKm) => {
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              status: 'completed' as DayPlanStatus,
              actualKm,
              updatedAt: new Date().toISOString(),
            }
          : plan
      ),
    }));

    // Update route progress
    const plan = get().plans.find((p) => p.id === id);
    if (plan) {
      const progress = get().routeProgress.get(plan.routeId);
      if (progress) {
        const newProgress = new Map(get().routeProgress);
        newProgress.set(plan.routeId, {
          ...progress,
          completedKm: progress.completedKm + actualKm,
          lastActivityDate: plan.date,
          daysActive: progress.daysActive + 1,
          averageKmPerDay:
            (progress.completedKm + actualKm) / (progress.daysActive + 1),
        });
        set({ routeProgress: newProgress });
      }
    }
  },

  skipPlan: (id) => {
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              status: 'skipped' as DayPlanStatus,
              updatedAt: new Date().toISOString(),
            }
          : plan
      ),
    }));
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  calculateTripSummary: () => {
    const { plans } = get();
    const completedPlans = plans.filter((p) => p.status === 'completed');
    const skippedPlans = plans.filter((p) => p.status === 'skipped');

    const distances = completedPlans
      .map((p) => p.actualKm || 0)
      .filter((d) => d > 0);

    const totalDistance = distances.reduce((sum, d) => sum + d, 0);

    return {
      totalDays: plans.length,
      cyclingDays: completedPlans.length,
      restDays: skippedPlans.length,
      totalDistanceKm: totalDistance,
      averageDistancePerDay:
        completedPlans.length > 0 ? totalDistance / completedPlans.length : 0,
      longestDay: distances.length > 0 ? Math.max(...distances) : 0,
      shortestDay: distances.length > 0 ? Math.min(...distances) : 0,
      routesCompleted: [], // TODO: Track completed routes
    };
  },

  getPlansForDateRange: (startDate, endDate) => {
    return get().plans.filter(
      (plan) => plan.date >= startDate && plan.date <= endDate
    );
  },

  getPlanForDate: (date) => {
    return get().plans.find((plan) => plan.date === date);
  },

  // Load trip plans from database
  loadTripPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const tripPlans = await tripPlanRepository.getAllTripPlans();
      // Auto-activate the most recent active trip if any
      const activeTripPlan = await tripPlanRepository.getActiveTripPlan();
      set({ tripPlans, activeTripPlan, tripPlansLoaded: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, tripPlansLoaded: true });
    }
  },

  // EuroVelo trip planning actions (legacy - kept for backwards compatibility)
  createTripPlan: async (route, startDate, dailyDistanceKm, name) => {
    const daily = dailyDistanceKm ?? get().settings.defaultDailyDistanceKm;
    const tripPlan = createEuroVeloTripPlan(route, startDate, daily, name);

    // Persist to database
    const saved = await tripPlanRepository.createTripPlan(tripPlan);

    set((state) => ({
      tripPlans: [...state.tripPlans, saved],
      activeTripPlan: saved,
    }));

    return saved;
  },

  // Universal trip planning (supports EuroVelo, custom routes, imported routes)
  createTripPlanFromAnyRoute: async (route, routeSource, startDate, dailyDistanceKm, name) => {
    const daily = dailyDistanceKm ?? get().settings.defaultDailyDistanceKm;
    const tripPlan = createTripPlanFromRoute(route, routeSource, startDate, daily, name);

    // Persist to database
    const saved = await tripPlanRepository.createTripPlan(tripPlan as EuroVeloTripPlan);

    set((state) => ({
      tripPlans: [...state.tripPlans, saved],
      activeTripPlan: saved,
    }));

    return saved as TripPlan;
  },

  setActiveTripPlan: (tripPlan) => set({ activeTripPlan: tripPlan }),

  updateTripPlan: async (id, updates) => {
    // Persist to database
    await tripPlanRepository.updateTripPlan(id, updates);

    set((state) => ({
      tripPlans: state.tripPlans.map((plan) =>
        plan.id === id
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      ),
      activeTripPlan:
        state.activeTripPlan?.id === id
          ? { ...state.activeTripPlan, ...updates, updatedAt: new Date().toISOString() }
          : state.activeTripPlan,
    }));
  },

  deleteTripPlan: async (id) => {
    // Delete from database
    await tripPlanRepository.deleteTripPlan(id);

    set((state) => ({
      tripPlans: state.tripPlans.filter((plan) => plan.id !== id),
      activeTripPlan: state.activeTripPlan?.id === id ? null : state.activeTripPlan,
    }));
  },

  completeTripDayPlan: async (tripId, dayPlanId, actualKm) => {
    const state = get();
    const tripPlan = state.tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) return;

    const dayPlanIndex = tripPlan.dayPlans.findIndex((d) => d.id === dayPlanId);
    if (dayPlanIndex === -1) return;

    // Update the day plan
    const updatedDayPlans = tripPlan.dayPlans.map((plan) =>
      plan.id === dayPlanId
        ? {
            ...plan,
            status: 'completed' as DayPlanStatus,
            actualKm,
            updatedAt: new Date().toISOString(),
          }
        : plan
    );

    // Optionally adjust remaining plans
    const adjustedTripPlan: EuroVeloTripPlan = {
      ...tripPlan,
      dayPlans: updatedDayPlans,
      updatedAt: new Date().toISOString(),
    };

    // Check if all days are completed
    const allCompleted = adjustedTripPlan.dayPlans.every(
      (d) => d.status === 'completed' || d.status === 'skipped'
    );
    if (allCompleted) {
      adjustedTripPlan.status = 'completed';
    } else if (adjustedTripPlan.status === 'planning') {
      adjustedTripPlan.status = 'active';
    }

    // Persist to database
    await tripPlanRepository.updateTripPlan(tripId, {
      dayPlans: adjustedTripPlan.dayPlans,
      status: adjustedTripPlan.status,
    });

    set({
      tripPlans: state.tripPlans.map((t) =>
        t.id === tripId ? adjustedTripPlan : t
      ),
      activeTripPlan:
        state.activeTripPlan?.id === tripId ? adjustedTripPlan : state.activeTripPlan,
    });
  },

  getTripPlanStats: (tripId) => {
    const tripPlan = get().tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) return null;
    return calculateTripStats(tripPlan);
  },

  // Expense actions
  loadExpenses: async (tripPlanId) => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseRepository.getExpensesByTripPlan(tripPlanId);
      set({ expenses, expensesLoaded: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await expenseRepository.createExpense(expenseData);
      set((state) => ({
        expenses: [...state.expenses, newExpense],
        isLoading: false,
      }));
      return newExpense;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateExpense: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedExpense = await expenseRepository.updateExpense(id, updates);
      if (updatedExpense) {
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === id ? updatedExpense : exp
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseRepository.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getExpenseSummary: async (tripPlanId) => {
    return expenseRepository.getExpenseSummary(tripPlanId);
  },

  getExpensesForDay: (dayPlanId) => {
    return get().expenses.filter((exp) => exp.dayPlanId === dayPlanId);
  },

  // Budget actions
  updateTripBudget: async (tripId, budget, currency) => {
    await tripPlanRepository.updateTripPlan(tripId, {
      budget,
      budgetCurrency: currency,
    });

    set((state) => ({
      tripPlans: state.tripPlans.map((plan) =>
        plan.id === tripId
          ? { ...plan, budget, budgetCurrency: currency, updatedAt: new Date().toISOString() }
          : plan
      ),
      activeTripPlan:
        state.activeTripPlan?.id === tripId
          ? { ...state.activeTripPlan, budget, budgetCurrency: currency, updatedAt: new Date().toISOString() }
          : state.activeTripPlan,
    }));
  },

  getBudgetStatus: (tripId) => {
    const state = get();
    const tripPlan = state.tripPlans.find((t) => t.id === tripId);
    if (!tripPlan || !tripPlan.budget) return null;

    const tripExpenses = state.expenses.filter((e) => e.tripPlanId === tripId);
    return calculateBudgetStatus(
      tripPlan.budget,
      tripExpenses,
      tripPlan.budgetCurrency || 'EUR'
    );
  },

  // Day plan editing actions
  updateDayPlan: async (tripId, dayPlanId, updates, shouldRecalculate = true) => {
    const state = get();
    const tripPlan = state.tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) {
      return { success: false, error: 'Trip plan not found' };
    }

    const dayPlanIndex = tripPlan.dayPlans.findIndex((d) => d.id === dayPlanId);
    if (dayPlanIndex === -1) {
      return { success: false, error: 'Day plan not found' };
    }

    const now = new Date().toISOString();
    let updatedDayPlans = [...tripPlan.dayPlans];

    // Check for date conflicts if date is being changed
    if (updates.date !== undefined) {
      const existingDates = getDayPlanDates(tripPlan.dayPlans);
      if (hasDateConflict(updates.date, existingDates, dayPlanId, tripPlan.dayPlans)) {
        return { success: false, error: 'Another day already has this date' };
      }
    }

    // Update the specific day plan
    updatedDayPlans[dayPlanIndex] = {
      ...updatedDayPlans[dayPlanIndex],
      ...updates,
      updatedAt: now,
    };

    // If targetKm changed, update the euroVeloSegment and recalculate subsequent days
    if (updates.targetKm !== undefined) {
      const day = updatedDayPlans[dayPlanIndex];
      const newEndKm = day.startKm + updates.targetKm;

      updatedDayPlans[dayPlanIndex] = {
        ...day,
        euroVeloSegment: day.euroVeloSegment
          ? {
              ...day.euroVeloSegment,
              endKm: newEndKm,
              distanceKm: updates.targetKm,
            }
          : undefined,
      };

      // Recalculate subsequent days if needed
      if (shouldRecalculate) {
        updatedDayPlans = recalculateSubsequentDays(updatedDayPlans, dayPlanIndex);
      }
    }

    // If date changed, resort by date
    if (updates.date !== undefined) {
      updatedDayPlans = resortDaysByDate(updatedDayPlans);
    }

    // Calculate new end date from the last day
    const sortedByDate = [...updatedDayPlans].sort((a, b) => a.date.localeCompare(b.date));
    const newEndDate = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].date : undefined;

    // Persist to database
    try {
      await tripPlanRepository.updateTripPlan(tripId, {
        dayPlans: updatedDayPlans,
        endDate: newEndDate,
        estimatedDays: updatedDayPlans.length,
      });

      const updatedTripPlan: EuroVeloTripPlan = {
        ...tripPlan,
        dayPlans: updatedDayPlans,
        endDate: newEndDate,
        estimatedDays: updatedDayPlans.length,
        updatedAt: now,
      };

      set({
        tripPlans: state.tripPlans.map((t) => (t.id === tripId ? updatedTripPlan : t)),
        activeTripPlan:
          state.activeTripPlan?.id === tripId ? updatedTripPlan : state.activeTripPlan,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  addRestDay: async (tripId, afterDayPlanId) => {
    const state = get();
    const tripPlan = state.tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) {
      return { success: false, error: 'Trip plan not found' };
    }

    const afterDayIndex = tripPlan.dayPlans.findIndex((d) => d.id === afterDayPlanId);
    if (afterDayIndex === -1) {
      return { success: false, error: 'Day plan not found' };
    }

    const afterDay = tripPlan.dayPlans[afterDayIndex];
    const now = new Date().toISOString();

    // Get the rest date and shift subsequent days' dates
    const { restDate, updatedDayPlans: shiftedDayPlans } = insertRestDayAfter(
      tripPlan.dayPlans,
      afterDayIndex
    );

    // Create the rest day
    const restDay = createRestDay(afterDay, afterDay.routeId, restDate);

    // Insert the rest day at the correct position
    const newDayPlans = [
      ...shiftedDayPlans.slice(0, afterDayIndex + 1),
      restDay,
      ...shiftedDayPlans.slice(afterDayIndex + 1),
    ];

    // Recalculate km ranges to maintain contiguity (rest day has 0 km, so subsequent days keep same startKm)
    const finalDayPlans = recalculateSubsequentDays(newDayPlans, afterDayIndex + 1);

    // Calculate new end date
    const sortedByDate = [...finalDayPlans].sort((a, b) => a.date.localeCompare(b.date));
    const newEndDate = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].date : undefined;

    // Persist to database
    try {
      await tripPlanRepository.updateTripPlan(tripId, {
        dayPlans: finalDayPlans,
        endDate: newEndDate,
        estimatedDays: finalDayPlans.length,
      });

      const updatedTripPlan: EuroVeloTripPlan = {
        ...tripPlan,
        dayPlans: finalDayPlans,
        endDate: newEndDate,
        estimatedDays: finalDayPlans.length,
        updatedAt: now,
      };

      set({
        tripPlans: state.tripPlans.map((t) => (t.id === tripId ? updatedTripPlan : t)),
        activeTripPlan:
          state.activeTripPlan?.id === tripId ? updatedTripPlan : state.activeTripPlan,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  removeDayPlan: async (tripId, dayPlanId) => {
    const state = get();
    const tripPlan = state.tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) {
      return { success: false, error: 'Trip plan not found' };
    }

    const dayPlanIndex = tripPlan.dayPlans.findIndex((d) => d.id === dayPlanId);
    if (dayPlanIndex === -1) {
      return { success: false, error: 'Day plan not found' };
    }

    // Don't allow removing if there's only one day
    if (tripPlan.dayPlans.length <= 1) {
      return { success: false, error: 'Cannot remove the only day in the trip' };
    }

    const now = new Date().toISOString();

    // Remove the day and recalculate
    const updatedDayPlans = removeDayAndRecalculate(tripPlan.dayPlans, dayPlanIndex);

    // Calculate new end date
    const sortedByDate = [...updatedDayPlans].sort((a, b) => a.date.localeCompare(b.date));
    const newEndDate = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].date : undefined;

    // Calculate new total distance
    const newTotalDistance = updatedDayPlans.reduce((sum, day) => sum + day.targetKm, 0);

    // Persist to database
    try {
      await tripPlanRepository.updateTripPlan(tripId, {
        dayPlans: updatedDayPlans,
        endDate: newEndDate,
        estimatedDays: updatedDayPlans.length,
        totalDistanceKm: newTotalDistance,
      });

      const updatedTripPlan: EuroVeloTripPlan = {
        ...tripPlan,
        dayPlans: updatedDayPlans,
        endDate: newEndDate,
        estimatedDays: updatedDayPlans.length,
        totalDistanceKm: newTotalDistance,
        updatedAt: now,
      };

      set({
        tripPlans: state.tripPlans.map((t) => (t.id === tripId ? updatedTripPlan : t)),
        activeTripPlan:
          state.activeTripPlan?.id === tripId ? updatedTripPlan : state.activeTripPlan,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));

// Selectors
export const selectTodayPlan = (state: PlannerState) =>
  state.plans.find((p) => p.date === getTodayISO());

export const selectUpcomingPlans = (state: PlannerState) => {
  const today = getTodayISO();
  return state.plans
    .filter((p) => p.date >= today && p.status === 'planned')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);
};

export const selectCompletedPlans = (state: PlannerState) =>
  state.plans.filter((p) => p.status === 'completed');

export const selectRouteProgress = (routeId: string) => (state: PlannerState) =>
  state.routeProgress.get(routeId);

// EuroVelo trip plan selectors
export const selectAllTripPlans = (state: PlannerState) => state.tripPlans;

export const selectActiveTripPlan = (state: PlannerState) => state.activeTripPlan;

export const selectTripPlansByStatus = (status: EuroVeloTripPlan['status']) => (state: PlannerState) =>
  state.tripPlans.filter((t) => t.status === status);

export const selectTripPlanById = (id: string) => (state: PlannerState) =>
  state.tripPlans.find((t) => t.id === id);

export const selectTripPlanByRouteId = (routeId: string) => (state: PlannerState) =>
  state.tripPlans.find((t) => t.dayPlans[0]?.routeId === routeId);

// Expense selectors
export const selectExpenses = (state: PlannerState) => state.expenses;

export const selectExpensesByCategory = (category: ExpenseCategory) => (state: PlannerState) =>
  state.expenses.filter((exp) => exp.category === category);

export const selectExpensesByDate = (date: string) => (state: PlannerState) =>
  state.expenses.filter((exp) => exp.date === date);

export const selectTotalExpenses = (state: PlannerState) =>
  state.expenses.reduce((sum, exp) => sum + exp.amount, 0);

export const selectExpensesLoaded = (state: PlannerState) => state.expensesLoaded;

export const selectTripPlansLoaded = (state: PlannerState) => state.tripPlansLoaded;
