/**
 * EuroVelo Container
 * Manages EuroVelo routes button and modal
 */

import React, { useState, useCallback } from 'react';
import { getAvailableRouteIds } from '../../../routes/services/routeLoader.service';
import { EuroVeloRoutesButton } from '../../../routes/components/EuroVeloRoutesButton';
import { EuroVeloRoutesModal } from '../../../routes/components/EuroVeloRoutesModal';
import { useRouteManagement } from '../../hooks';

export function EuroVeloContainer() {
  const [showRoutesModal, setShowRoutesModal] = useState(false);

  const {
    routes,
    enabledRouteIds,
    isLoading: routesLoading,
    toggleRoute,
  } = useRouteManagement();

  const loadedRouteIds = routes.map(r => r.euroVeloId);

  const handleOpenModal = useCallback(() => {
    setShowRoutesModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRoutesModal(false);
  }, []);

  return (
    <>
      <EuroVeloRoutesButton
        activeCount={enabledRouteIds.length}
        onPress={handleOpenModal}
      />
      <EuroVeloRoutesModal
        visible={showRoutesModal}
        onClose={handleCloseModal}
        availableRouteIds={getAvailableRouteIds()}
        enabledRouteIds={enabledRouteIds}
        loadedRouteIds={loadedRouteIds}
        isLoading={routesLoading}
        onToggleRoute={toggleRoute}
      />
    </>
  );
}
