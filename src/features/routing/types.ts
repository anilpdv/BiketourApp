// Route planning mode
export type RoutePlanningMode = 'point-to-point' | 'freeform' | 'modify-existing';

// Coordinate type
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Waypoint in a route
export interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  type: 'start' | 'via' | 'end';
  order: number;
}

// Elevation point
export interface ElevationPoint {
  distance: number; // Distance from start in meters
  elevation: number; // Elevation in meters
}

// Route instruction
export interface RouteInstruction {
  type: string;
  text: string;
  distance: number;
  duration: number;
  modifier?: string;
}

// Calculated route from routing service
export interface CalculatedRoute {
  waypoints: Waypoint[];
  geometry: Coordinate[];
  distance: number; // Total distance in meters
  duration: number; // Estimated duration in seconds
  elevation?: {
    gain: number;
    loss: number;
    profile?: ElevationPoint[];
  };
  instructions?: RouteInstruction[];
}

// Custom route saved by user
export interface CustomRoute {
  id: string;
  name: string;
  description?: string;
  mode: RoutePlanningMode;
  waypoints: Waypoint[];
  geometry: Coordinate[];
  distance: number; // meters
  duration?: number; // seconds
  elevationGain?: number;
  elevationLoss?: number;
  baseRouteId?: string; // For modified EuroVelo routes
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// Summary for list display
export interface CustomRouteSummary {
  id: string;
  name: string;
  description?: string;
  mode: RoutePlanningMode;
  distance: number;
  elevationGain?: number;
  waypointCount: number;
  createdAt: string;
  updatedAt: string;
}

// History entry for undo/redo
export interface RouteHistoryEntry {
  waypoints: Waypoint[];
  geometry: Coordinate[];
  timestamp: number;
}

// Routing state
export interface RoutingState {
  // Planning mode
  mode: RoutePlanningMode | null;
  isPlanning: boolean;

  // Current route being planned
  currentRoute: Partial<CustomRoute> | null;
  waypoints: Waypoint[];
  calculatedGeometry: Coordinate[];

  // History for undo/redo
  history: RouteHistoryEntry[];
  historyIndex: number;

  // Calculation state
  isCalculating: boolean;
  error: string | null;
}
