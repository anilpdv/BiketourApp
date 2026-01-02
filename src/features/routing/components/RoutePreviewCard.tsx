import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomRouteSummary, RoutePlanningMode } from '../types';
import { formatDistance } from '../services/routing.service';
import { colors, spacing, borderRadius, shadows } from '../../../shared/design/tokens';

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
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  containerSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: colors.primaryBg.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    color: colors.neutral[800],
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  date: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.status.errorBg,
  },
  actionIcon: {
    fontSize: 16,
  },
});
