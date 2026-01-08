import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DayPlan, DayPlanStatus } from '../types';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

interface DayPlanCardProps {
  dayPlan: DayPlan;
  dayNumber: number;
  isToday?: boolean;
  onPress?: () => void;
  onMarkComplete?: () => void;
}

const STATUS_CONFIG: Record<DayPlanStatus, { color: string; icon: string; label: string }> = {
  planned: { color: colors.primary[500], icon: 'clock-outline', label: 'Planned' },
  in_progress: { color: colors.status.warning, icon: 'bike', label: 'In Progress' },
  completed: { color: colors.status.success, icon: 'check-circle', label: 'Completed' },
  skipped: { color: colors.neutral[400], icon: 'close-circle', label: 'Skipped' },
};

export function DayPlanCard({
  dayPlan,
  dayNumber,
  isToday = false,
  onPress,
  onMarkComplete,
}: DayPlanCardProps) {
  const theme = useTheme();
  const statusConfig = STATUS_CONFIG[dayPlan.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        isToday && styles.todayContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isToday && (
        <View style={[styles.todayBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.todayText}>TODAY</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.dayInfo}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            Day {dayNumber}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatDate(dayPlan.date)}
          </Text>
        </View>
        <Chip
          mode="flat"
          compact
          icon={() => (
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
          )}
          style={{ backgroundColor: `${statusConfig.color}15` }}
          textStyle={{ color: statusConfig.color, fontSize: 12 }}
        >
          {statusConfig.label}
        </Chip>
      </View>

      <View style={styles.distanceRow}>
        <MaterialCommunityIcons
          name="map-marker-distance"
          size={20}
          color={theme.colors.primary}
        />
        <Text variant="bodyLarge" style={styles.distanceText}>
          {Math.round(dayPlan.targetKm)} km
        </Text>
        {dayPlan.actualKm !== null && (
          <Text variant="bodySmall" style={{ color: colors.status.success }}>
            (actual: {dayPlan.actualKm} km)
          </Text>
        )}
      </View>

      {dayPlan.euroVeloSegment && (
        <View style={styles.segmentInfo}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            km {Math.round(dayPlan.euroVeloSegment.startKm)} - {Math.round(dayPlan.euroVeloSegment.endKm)}
          </Text>
        </View>
      )}

      {isToday && dayPlan.status === 'planned' && onMarkComplete && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
          onPress={onMarkComplete}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  todayBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  todayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dayInfo: {
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distanceText: {
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  segmentInfo: {
    marginTop: spacing.xs,
    paddingLeft: spacing.lg + spacing.xs,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
