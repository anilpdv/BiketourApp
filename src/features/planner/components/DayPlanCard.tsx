import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DayPlan, DayPlanStatus } from '../types';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

interface DayPlanCardProps {
  dayPlan: DayPlan;
  dayNumber: number;
  isToday?: boolean;
  onPress?: () => void;
  onMarkComplete?: () => void;
  onAddExpense?: () => void;
  showAddExpense?: boolean;
}

const STATUS_CONFIG: Record<DayPlanStatus, { color: string; icon: string; label: string }> = {
  planned: { color: colors.primary[500], icon: 'clock-outline', label: 'Planned' },
  in_progress: { color: colors.status.warning, icon: 'bike', label: 'In Progress' },
  completed: { color: colors.status.success, icon: 'check-circle', label: 'Completed' },
  skipped: { color: colors.neutral[400], icon: 'close-circle', label: 'Skipped' },
};

// Check if a day is a rest day
const isRestDay = (dayPlan: DayPlan): boolean => {
  return dayPlan.targetKm === 0;
};

export function DayPlanCard({
  dayPlan,
  dayNumber,
  isToday = false,
  onPress,
  onMarkComplete,
  onAddExpense,
  showAddExpense = false,
}: DayPlanCardProps) {
  const theme = useTheme();
  const restDay = isRestDay(dayPlan);

  // Get status config - use 'Rest' for rest days
  const getStatusConfig = () => {
    if (restDay && dayPlan.status !== 'completed') {
      return { color: colors.neutral[500], icon: 'bed', label: 'Rest Day' };
    }
    return STATUS_CONFIG[dayPlan.status];
  };
  const statusConfig = getStatusConfig();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        isToday && styles.todayContainer,
        restDay && styles.restDayContainer,
      ]}
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
        <View style={styles.headerRight}>
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
          {onPress && (
            <IconButton
              icon="pencil"
              size={18}
              iconColor={theme.colors.primary}
              style={styles.editButton}
              onPress={onPress}
            />
          )}
        </View>
      </View>

      {/* Distance Row - Show differently for rest days */}
      {restDay ? (
        <View style={styles.restDayContent}>
          <MaterialCommunityIcons
            name="bed"
            size={20}
            color={colors.neutral[400]}
          />
          <Text variant="bodyMedium" style={styles.restDayText}>
            No cycling today
          </Text>
        </View>
      ) : (
        <>
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
        </>
      )}

      {/* Notes Preview */}
      {dayPlan.notes && dayPlan.notes.length > 0 && dayPlan.notes !== 'Rest day' && (
        <View style={styles.notesPreview}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={14}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}
          >
            {dayPlan.notes}
          </Text>
        </View>
      )}

      {isToday && dayPlan.status === 'planned' && onMarkComplete && !restDay && (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
          onPress={onMarkComplete}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}

      {showAddExpense && onAddExpense && (
        <TouchableOpacity
          style={[styles.addExpenseButton, { borderColor: theme.colors.primary }]}
          onPress={onAddExpense}
        >
          <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          <Text style={[styles.addExpenseButtonText, { color: theme.colors.primary }]}>
            Add Expense
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
  restDayContainer: {
    opacity: 0.85,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButton: {
    margin: -4,
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
  restDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  restDayText: {
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  notesText: {
    flex: 1,
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
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  addExpenseButtonText: {
    fontWeight: '500',
    fontSize: 13,
  },
});
