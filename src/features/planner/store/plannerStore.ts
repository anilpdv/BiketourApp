import { create } from 'zustand';
import {
  DayPlan,
  DayPlanStatus,
  RouteProgress,
  TripSummary,
  PlannerSettings,
  EuroVeloTripPlan,
} from '../types';
import { ParsedRoute } from '../../routes/types';
import {
  createEuroVeloTripPlan,
  calculateTripStats,
  adjustRemainingPlans,
} from '../services/euroveloPlanningService';

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

  // EuroVelo trip planning actions
  createTripPlan: (
    route: ParsedRoute,
    startDate: string,
    dailyDistanceKm?: number,
    name?: string
  ) => EuroVeloTripPlan;
  setActiveTripPlan: (tripPlan: EuroVeloTripPlan | null) => void;
  updateTripPlan: (id: string, updates: Partial<EuroVeloTripPlan>) => void;
  deleteTripPlan: (id: string) => void;
  completeTripDayPlan: (tripId: string, dayPlanId: string, actualKm: number) => void;
  getTripPlanStats: (tripId: string) => ReturnType<typeof calculateTripStats> | null;
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

  // EuroVelo trip planning actions
  createTripPlan: (route, startDate, dailyDistanceKm, name) => {
    const daily = dailyDistanceKm ?? get().settings.defaultDailyDistanceKm;
    const tripPlan = createEuroVeloTripPlan(route, startDate, daily, name);

    set((state) => ({
      tripPlans: [...state.tripPlans, tripPlan],
      activeTripPlan: tripPlan,
    }));

    return tripPlan;
  },

  setActiveTripPlan: (tripPlan) => set({ activeTripPlan: tripPlan }),

  updateTripPlan: (id, updates) => {
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

  deleteTripPlan: (id) => {
    set((state) => ({
      tripPlans: state.tripPlans.filter((plan) => plan.id !== id),
      activeTripPlan: state.activeTripPlan?.id === id ? null : state.activeTripPlan,
    }));
  },

  completeTripDayPlan: (tripId, dayPlanId, actualKm) => {
    set((state) => {
      const tripPlan = state.tripPlans.find((t) => t.id === tripId);
      if (!tripPlan) return state;

      const dayPlanIndex = tripPlan.dayPlans.findIndex((d) => d.id === dayPlanId);
      if (dayPlanIndex === -1) return state;

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

      return {
        tripPlans: state.tripPlans.map((t) =>
          t.id === tripId ? adjustedTripPlan : t
        ),
        activeTripPlan:
          state.activeTripPlan?.id === tripId ? adjustedTripPlan : state.activeTripPlan,
      };
    });
  },

  getTripPlanStats: (tripId) => {
    const tripPlan = get().tripPlans.find((t) => t.id === tripId);
    if (!tripPlan) return null;
    return calculateTripStats(tripPlan);
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
