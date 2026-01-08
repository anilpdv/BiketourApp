import { RouteVariant, RoutePoint } from '../routes/types';
import { DailyForecast, CyclingScore } from '../weather/types';

// ==========================================
// ROUTE SOURCE TYPE (for universal route planning)
// ==========================================

export type RouteSource =
  | { type: 'eurovelo'; euroVeloId: number; variant: RouteVariant }
  | { type: 'custom'; customRouteId: string }
  | { type: 'imported'; name: string };

// Helper to get route source display name
export function getRouteSourceDisplayName(source: RouteSource): string {
  switch (source.type) {
    case 'eurovelo':
      return `EuroVelo ${source.euroVeloId}`;
    case 'custom':
      return 'Custom Route';
    case 'imported':
      return source.name;
    default:
      return 'Unknown Route';
  }
}

// ==========================================
// DAY PLAN TYPES
// ==========================================

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

// Trip plan status type
export type TripPlanStatus = 'planning' | 'active' | 'completed' | 'paused';

// Trip plan for any route type
export interface EuroVeloTripPlan {
  id: string;
  name: string;
  // Legacy fields (kept for backwards compatibility)
  euroVeloId: number;
  variant: RouteVariant;
  // New universal route source (optional for backwards compatibility)
  routeSource?: RouteSource;
  startDate: string;
  endDate?: string;
  dailyDistanceKm: number;
  dayPlans: DayPlan[];
  totalDistanceKm: number;
  estimatedDays: number;
  status: TripPlanStatus;
  createdAt: string;
  updatedAt: string;
}

// Type alias for generic trip plan (same as EuroVeloTripPlan)
export type TripPlan = EuroVeloTripPlan;

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

// ==========================================
// EXPENSE TRACKING TYPES
// ==========================================

export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'repairs'
  | 'other';

export interface Expense {
  id: string;
  tripPlanId: string;
  dayPlanId?: string;
  date: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  currency: string;
  byCategory: Record<ExpenseCategory, number>;
  byDay: Record<string, number>;
  byCountry: Record<string, number>;
  averagePerDay: number;
}

// ==========================================
// WEATHER INTEGRATION TYPES
// ==========================================

export interface DayWeatherForecast {
  dayPlanId: string;
  date: string;
  location: { latitude: number; longitude: number };
  forecast: DailyForecast;
  cyclingScore: CyclingScore;
  fetchedAt: string;
}

export interface WeatherWarning {
  dayPlanId: string;
  severity: 'moderate' | 'severe';
  message: string;
}

// ==========================================
// SEGMENT BUILDER TYPES
// ==========================================

export interface SegmentMarker {
  id: string;
  routeId: string;
  distanceKm: number;
  coordinate: { latitude: number; longitude: number };
  type: 'start' | 'end';
  dayIndex: number;
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export interface NearbyPOI {
  poiId: string;
  name: string;
  category: string;
  distanceFromEndKm: number;
  coordinate: { latitude: number; longitude: number };
}

export interface DaySegment {
  id: string;
  dayPlanId: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  startCoordinate: { latitude: number; longitude: number };
  endCoordinate: { latitude: number; longitude: number };
  elevationProfile: ElevationPoint[];
  elevationGain: number;
  elevationLoss: number;
  nearbyPOIs: NearbyPOI[];
}
