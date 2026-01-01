// Navigation feature - Active GPS navigation for bike routes

// Types
export * from './types';

// Store
export { useNavigationStore } from './store/navigationStore';

// Hooks
export { useActiveNavigation } from './hooks/useActiveNavigation';
export type { UseActiveNavigationReturn } from './hooks/useActiveNavigation';

// Components
export { NavigationOverlay } from './components/NavigationOverlay';
export { NavigationStartButton } from './components/NavigationStartButton';
export { SpeedDisplay } from './components/SpeedDisplay';

// Services
export {
  findNearestPointOnRoute,
  calculateProgress,
  calculateCumulativeDistances,
  smoothSpeed,
  metersPerSecondToKmh,
  formatSpeed,
  formatDistance,
  formatTime,
  estimateTimeRemaining,
} from './services/navigation.service';
