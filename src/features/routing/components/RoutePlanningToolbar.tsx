import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoutingStore } from '../store/routingStore';
import { RoutePlanningMode } from '../types';

interface RoutePlanningToolbarProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const MODE_LABELS: Record<RoutePlanningMode, { label: string; icon: string }> = {
  'point-to-point': { label: 'Route', icon: '🛣️' },
  freeform: { label: 'Draw', icon: '✏️' },
  'modify-existing': { label: 'Modify', icon: '🔧' },
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
  } = useRoutingStore();

  if (!isPlanning || !mode) {
    return null;
  }

  const modeInfo = MODE_LABELS[mode];

  return (
    <View style={styles.container}>
      {/* Mode indicator */}
      <View style={styles.modeIndicator}>
        <Text style={styles.modeIcon}>{modeInfo.icon}</Text>
        <Text style={styles.modeLabel}>{modeInfo.label}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Undo */}
        <TouchableOpacity
          style={[styles.actionButton, !canUndo() && styles.actionButtonDisabled]}
          onPress={undo}
          disabled={!canUndo()}
        >
          <Text style={styles.actionIcon}>↩️</Text>
        </TouchableOpacity>

        {/* Redo */}
        <TouchableOpacity
          style={[styles.actionButton, !canRedo() && styles.actionButtonDisabled]}
          onPress={redo}
          disabled={!canRedo()}
        >
          <Text style={styles.actionIcon}>↪️</Text>
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity
          style={[styles.actionButton, waypoints.length === 0 && styles.actionButtonDisabled]}
          onPress={clearWaypoints}
          disabled={waypoints.length === 0}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>

        {/* Calculate Route */}
        {mode === 'point-to-point' && waypoints.length >= 2 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.calculateButton]}
            onPress={calculateCurrentRoute}
            disabled={isCalculating}
          >
            <Text style={styles.actionIcon}>{isCalculating ? '⏳' : '🔄'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Save/Cancel buttons */}
      <View style={styles.saveCancel}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, waypoints.length < 2 && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={waypoints.length < 2}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  actionIcon: {
    fontSize: 16,
  },
  saveCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
