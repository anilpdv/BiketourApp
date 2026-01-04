/**
 * POI Visibility Hook
 * Simple hook for managing POI layer visibility state
 */

import { useState, useCallback } from 'react';
import { logger } from '../../../shared/utils';

export interface UsePOIVisibilityReturn {
  showPOIs: boolean;
  togglePOIs: () => void;
  setPOIsVisible: (visible: boolean) => void;
}

/**
 * Hook for managing POI visibility toggle state
 * Default to true for a camping-focused app
 */
export function usePOIVisibility(): UsePOIVisibilityReturn {
  const [showPOIs, setShowPOIs] = useState(true);

  const togglePOIs = useCallback(() => {
    logger.info('poi', '=== TOGGLE POIs ===', { currentState: showPOIs });
    setShowPOIs((prev) => !prev);
  }, [showPOIs]);

  const setPOIsVisible = useCallback((visible: boolean) => {
    setShowPOIs(visible);
  }, []);

  return {
    showPOIs,
    togglePOIs,
    setPOIsVisible,
  };
}
