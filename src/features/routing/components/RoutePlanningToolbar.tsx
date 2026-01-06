import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoutingStore } from '../store/routingStore';
import { RoutePlanningMode } from '../types';

interface RoutePlanningToolbarProps {
  onSave?: () => void;
  onCancel?: () => void;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODE_CONFIG: Record<RoutePlanningMode, { label: string; icon: IconName }> = {
  'point-to-point': { label: 'Route', icon: 'map-marker-path' },
  freeform: { label: 'Draw', icon: 'pencil' },
  'modify-existing': { label: 'Modify', icon: 'wrench' },
};

function RoutePlanningToolbarComponent({ onSave, onCancel }: RoutePlanningToolbarProps) {
  const {
    mode,
    isPlanning,
    waypoints,
    isCalculating,
    undo,
    redo,
    canUndo,
    canRedo,
    clearWaypoints,
    calculateCurrentRoute,
    reverseRoute,
  } = useRoutingStore();

  if (!isPlanning || !mode) {
    return null;
  }

  const modeConfig = MODE_CONFIG[mode];

  return (
    <View style={styles.container}>
      {/* Mode indicator - icon only */}
      <View style={styles.modeIndicator}>
        <MaterialCommunityIcons name={modeConfig.icon} size={20} color="#1976D2" />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Undo */}
        <TouchableOpacity
          style={[styles.actionButton, !canUndo() && styles.actionButtonDisabled]}
          onPress={undo}
          disabled={!canUndo()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Undo last action"
          accessibilityState={{ disabled: !canUndo() }}
        >
          <MaterialCommunityIcons
            name="undo"
            size={20}
            color={canUndo() ? '#555' : '#999'}
          />
        </TouchableOpacity>

        {/* Redo */}
        <TouchableOpacity
          style={[styles.actionButton, !canRedo() && styles.actionButtonDisabled]}
          onPress={redo}
          disabled={!canRedo()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Redo last action"
          accessibilityState={{ disabled: !canRedo() }}
        >
          <MaterialCommunityIcons
            name="redo"
            size={20}
            color={canRedo() ? '#555' : '#999'}
          />
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity
          style={[styles.actionButton, waypoints.length === 0 && styles.actionButtonDisabled]}
          onPress={clearWaypoints}
          disabled={waypoints.length === 0}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear all waypoints"
          accessibilityState={{ disabled: waypoints.length === 0 }}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={waypoints.length > 0 ? '#555' : '#999'}
          />
        </TouchableOpacity>

        {/* Reverse Route */}
        <TouchableOpacity
          style={[styles.actionButton, waypoints.length < 2 && styles.actionButtonDisabled]}
          onPress={reverseRoute}
          disabled={waypoints.length < 2}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reverse route direction"
          accessibilityState={{ disabled: waypoints.length < 2 }}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={20}
            color={waypoints.length >= 2 ? '#555' : '#999'}
          />
        </TouchableOpacity>

        {/* Calculate Route */}
        {mode === 'point-to-point' && waypoints.length >= 2 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.calculateButton, isCalculating && styles.actionButtonDisabled]}
            onPress={calculateCurrentRoute}
            disabled={isCalculating}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isCalculating ? 'Calculating route' : 'Calculate route'}
            accessibilityState={{ disabled: isCalculating }}
          >
            <MaterialCommunityIcons
              name={isCalculating ? 'loading' : 'lightning-bolt'}
              size={20}
              color={isCalculating ? '#999' : '#1976D2'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Save/Cancel buttons */}
      <View style={styles.saveCancel}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel route planning"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, waypoints.length < 2 && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={waypoints.length < 2}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save route"
          accessibilityState={{ disabled: waypoints.length < 2 }}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const RoutePlanningToolbar = memo(RoutePlanningToolbarComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  calculateButton: {
    backgroundColor: '#e3f2fd',
  },
  saveCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
