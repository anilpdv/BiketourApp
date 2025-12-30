import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomRouteSummary, RoutePlanningMode } from '../types';
import { formatDistance } from '../services/routing.service';

const MODE_ICONS: Record<RoutePlanningMode, string> = {
  'point-to-point': '🛣️',
  freeform: '✏️',
  'modify-existing': '🔧',
};

interface RoutePreviewCardProps {
  route: CustomRouteSummary;
  onPress?: (route: CustomRouteSummary) => void;
  onExport?: (route: CustomRouteSummary) => void;
  onDelete?: (route: CustomRouteSummary) => void;
  isSelected?: boolean;
}

function RoutePreviewCardComponent({
  route,
  onPress,
  onExport,
  onDelete,
  isSelected = false,
}: RoutePreviewCardProps) {
  const modeIcon = MODE_ICONS[route.mode] || '📍';

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={() => onPress?.(route)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.modeIcon}>
          <Text style={styles.modeIconText}>{modeIcon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {route.name}
          </Text>
          {route.description && (
            <Text style={styles.description} numberOfLines={1}>
              {route.description}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistance(route.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.waypointCount}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        {route.elevationGain !== undefined && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>+{Math.round(route.elevationGain)}m</Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(route.updatedAt)}</Text>
        <View style={styles.actions}>
          {onExport && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onExport(route);
              }}
            >
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(route);
              }}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const RoutePreviewCard = memo(RoutePreviewCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerSelected: {
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#f0f7ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeIconText: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionIcon: {
    fontSize: 16,
  },
});
