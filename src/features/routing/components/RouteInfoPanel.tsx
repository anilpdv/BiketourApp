import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoutingStore } from '../store/routingStore';
import { formatDistance, formatDuration, calculatePathDistance } from '../services/routing.service';

interface RouteInfoPanelProps {
  duration?: number; // seconds
  elevationGain?: number; // meters
  elevationLoss?: number; // meters
}

function RouteInfoPanelComponent({
  duration,
  elevationGain,
  elevationLoss,
}: RouteInfoPanelProps) {
  const { waypoints, calculatedGeometry, isCalculating } = useRoutingStore();

  if (waypoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.hintText}>
          Tap on the map to add waypoints
        </Text>
      </View>
    );
  }

  // Calculate distance
  const distance = calculatedGeometry.length > 0
    ? calculatePathDistance(calculatedGeometry)
    : 0;

  return (
    <View style={styles.container}>
      {/* Waypoints count */}
      <View style={styles.stat}>
        <Text style={styles.statValue}>{waypoints.length}</Text>
        <Text style={styles.statLabel}>points</Text>
      </View>

      {/* Distance */}
      <View style={[styles.stat, styles.statBorder]}>
        <Text style={styles.statValue}>
          {isCalculating ? '...' : formatDistance(distance)}
        </Text>
        <Text style={styles.statLabel}>distance</Text>
      </View>

      {/* Duration (if available) */}
      {duration !== undefined && (
        <View style={[styles.stat, styles.statBorder]}>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>est. time</Text>
        </View>
      )}

      {/* Elevation (if available) */}
      {(elevationGain !== undefined || elevationLoss !== undefined) && (
        <View style={[styles.stat, styles.statBorder]}>
          <View style={styles.elevationRow}>
            {elevationGain !== undefined && (
              <Text style={styles.elevationUp}>
                ↑{Math.round(elevationGain)}m
              </Text>
            )}
            {elevationLoss !== undefined && (
              <Text style={styles.elevationDown}>
                ↓{Math.round(elevationLoss)}m
              </Text>
            )}
          </View>
          <Text style={styles.statLabel}>elevation</Text>
        </View>
      )}
    </View>
  );
}

export const RouteInfoPanel = memo(RouteInfoPanelComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  elevationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  elevationUp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  elevationDown: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
});
