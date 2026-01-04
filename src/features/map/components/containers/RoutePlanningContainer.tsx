/**
 * Route Planning Container
 * Manages route planning FAB, toolbar, and save dialog
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RoutePlanningToolbar, SaveRouteDialog } from '../../../routing';
import { RoutePlanningFAB } from '../RoutePlanningFAB';
import { spacing } from '../../../../shared/design/tokens';

interface RoutePlanningContainerProps {
  isPlanning: boolean;
  isNavigating: boolean;
  waypointCount: number;
  routeDistance: number;
  editingRouteId: string | null;
  editingRouteName: string | null;
  editingRouteDescription: string | null;
  onStartPlanning: () => void;
  onCancelPlanning: () => void;
  onSaveRoute: (name: string, description?: string) => Promise<void>;
}

export function RoutePlanningContainer({
  isPlanning,
  isNavigating,
  waypointCount,
  routeDistance,
  editingRouteId,
  editingRouteName,
  editingRouteDescription,
  onStartPlanning,
  onCancelPlanning,
  onSaveRoute,
}: RoutePlanningContainerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = useCallback(async (name: string, description?: string) => {
    await onSaveRoute(name, description);
    setShowSaveDialog(false);
  }, [onSaveRoute]);

  const handleCancelPlanning = useCallback(() => {
    if (waypointCount > 0 || editingRouteId) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes to this route.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancelPlanning }
        ]
      );
    } else {
      onCancelPlanning();
    }
  }, [waypointCount, editingRouteId, onCancelPlanning]);

  return (
    <>
      {/* Route Planning FAB - hide during navigation */}
      <RoutePlanningFAB
        onPress={onStartPlanning}
        isPlanning={isPlanning || isNavigating}
      />

      {/* Route Planning Toolbar - hide during navigation */}
      {isPlanning && !isNavigating && (
        <View style={styles.toolbarContainer}>
          <RoutePlanningToolbar
            onSave={() => setShowSaveDialog(true)}
            onCancel={handleCancelPlanning}
          />
        </View>
      )}

      {/* Save Route Dialog */}
      <SaveRouteDialog
        visible={showSaveDialog}
        onSave={handleSave}
        onCancel={() => setShowSaveDialog(false)}
        distance={routeDistance}
        waypointCount={waypointCount}
        initialName={editingRouteName || undefined}
        initialDescription={editingRouteDescription || undefined}
        isEditing={!!editingRouteId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  toolbarContainer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
});
