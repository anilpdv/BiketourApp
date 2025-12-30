import { RouteVariant, RoutePoint } from '../routes/types';

// Day plan status
export type DayPlanStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

// EuroVelo route segment for day planning
export interface EuroVeloSegment {
  routeId: string;           // e.g., "ev6-developed"
  euroVeloId: number;        // e.g., 6
  variant: RouteVariant;     // "full" or "developed"
  startKm: number;           // Start kilometer on route
  endKm: number;             // End kilometer on route
  distanceKm: number;        // Distance for this segment
  startPoint: {
    latitude: number;
    longitude: number;
  };
  endPoint: {
    latitude: number;
    longitude: number;
  };
}

// Individual day plan
export interface DayPlan {
  id: string;
  date: string;           // ISO date string (YYYY-MM-DD)
  routeId: string;
  startKm: number;        // Starting distance along route
  targetKm: number;       // Target distance along route
  actualKm: number | null; // Actual distance cycled
  status: DayPlanStatus;
  notes: string;
  weatherCode?: number;   // Recorded weather for the day
  temperature?: number;
  euroVeloSegment?: EuroVeloSegment; // Optional EuroVelo segment reference
  createdAt: string;
  updatedAt: string;
}

// Trip plan for EuroVelo route
export interface EuroVeloTripPlan {
  id: string;
  name: string;
  euroVeloId: number;
  variant: RouteVariant;
  startDate: string;
  endDate?: string;
  dailyDistanceKm: number;
  dayPlans: DayPlan[];
  totalDistanceKm: number;
  estimatedDays: number;
  status: 'planning' | 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

// Route progress tracking
export interface RouteProgress {
  routeId: string;
  totalDistanceKm: number;
  completedKm: number;
  startDate: string | null;
  lastActivityDate: string | null;
  daysActive: number;
  averageKmPerDay: number;
}

// Daily statistics
export interface DayStats {
  date: string;
  distanceKm: number;
  elevationGain: number;
  movingTimeMinutes: number;
  averageSpeed: number;
}

// Trip summary
export interface TripSummary {
  totalDays: number;
  cyclingDays: number;
  restDays: number;
  totalDistanceKm: number;
  averageDistancePerDay: number;
  longestDay: number;
  shortestDay: number;
  routesCompleted: string[];
}

// Planner settings
export interface PlannerSettings {
  defaultDailyDistanceKm: number;
  preferredStartTime: string; // HH:MM
  restDayInterval: number;    // Every N days
  showWeatherInPlanner: boolean;
}
