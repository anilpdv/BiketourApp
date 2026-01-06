import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomRouteSummary, RoutePlanningMode } from '../types';
import { formatDistance } from '../services/routing.service';
import { colors, spacing, borderRadius, shadows, typography } from '../../../shared/design/tokens';

// Mode icon configuration with colors
const MODE_CONFIG: Record<RoutePlanningMode, { icon: string; color: string; bgColor: string }> = {
  'point-to-point': { icon: 'road-variant', color: '#1565C0', bgColor: '#E3F2FD' },
  freeform: { icon: 'pencil', color: '#7B1FA2', bgColor: '#F3E5F5' },
  'modify-existing': { icon: 'wrench', color: '#E65100', bgColor: '#FFF3E0' },
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
  const modeConfig = MODE_CONFIG[route.mode] || MODE_CONFIG['point-to-point'];

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
        <View style={[styles.modeIcon, { backgroundColor: modeConfig.bgColor }]}>
          <MaterialCommunityIcons
            name={modeConfig.icon as any}
            size={22}
            color={modeConfig.color}
          />
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
          <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.neutral[500]} />
          <Text style={styles.statValue}>{formatDistance(route.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="map-marker-multiple" size={14} color={colors.neutral[500]} />
          <Text style={styles.statValue}>{route.waypointCount}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        {route.elevationGain !== undefined && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="trending-up" size={14} color={colors.neutral[500]} />
            <Text style={styles.statValue}>+{Math.round(route.elevationGain)}m</Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="calendar" size={12} color={colors.neutral[400]} />
          <Text style={styles.date}>{formatDate(route.updatedAt)}</Text>
        </View>
        <View style={styles.actions}>
          {onExport && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onExport(route);
              }}
            >
              <MaterialCommunityIcons name="export-variant" size={18} color={colors.neutral[600]} />
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
              <MaterialCommunityIcons name="delete-outline" size={18} color={colors.status.error} />
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
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    gap: 2,
  },
  statValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: typography.fontSizes.xs,
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
});
