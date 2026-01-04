/**
 * POI Selection Hook
 * Simple hook for managing POI selection state
 */

import { useCallback } from 'react';
import { usePOIStore, POI } from '../../pois';

export interface UsePOISelectionReturn {
  selectedPOI: POI | null;
  selectPOI: (poi: POI | null) => void;
  handlePOIPress: (poi: POI) => void;
}

/**
 * Hook for managing POI selection
 */
export function usePOISelection(): UsePOISelectionReturn {
  const selectedPOI = usePOIStore((state) => state.selectedPOI);
  const selectPOI = usePOIStore((state) => state.selectPOI);

  const handlePOIPress = useCallback(
    (poi: POI) => {
      selectPOI(poi);
    },
    [selectPOI]
  );

  return {
    selectedPOI,
    selectPOI,
    handlePOIPress,
  };
}
