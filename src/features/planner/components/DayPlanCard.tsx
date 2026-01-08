import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DayPlan, DayPlanStatus } from '../types';
import { colors, spacing, borderRadius, shadows } from '../../../shared/design/tokens';

interface DayPlanCardProps {
  dayPlan: DayPlan;
  dayNumber: number;
  isToday?: boolean;
  isPast?: boolean;
  onPress?: () => void;
  onMarkComplete?: () => void;
  onAddExpense?: () => void;
  showAddExpense?: boolean;
}

// Distinct colors for each status - NOT all green
const STATUS_CONFIG: Record<DayPlanStatus, { color: string; bgColor: string; icon: string; label: string }> = {
  planned: {
    color: colors.secondary[600],
    bgColor: colors.secondary[50],
    icon: 'clock-outline',
    label: 'Planned'
  },
  in_progress: {
    color: colors.status.warning,
    bgColor: '#FFF3E0',
    icon: 'bike',
    label: 'In Progress'
  },
  completed: {
    color: colors.status.success,
    bgColor: colors.primary[50],
    icon: 'check-circle',
    label: 'Done'
  },
  skipped: {
    color: colors.neutral[500],
    bgColor: colors.neutral[100],
    icon: 'close-circle',
    label: 'Skipped'
  },
};

const REST_DAY_CONFIG = {
  color: colors.neutral[400],
  bgColor: colors.neutral[50],
  icon: 'coffee',
  label: 'Rest',
};

const isRestDay = (dayPlan: DayPlan): boolean => {
  return dayPlan.targetKm === 0;
};

export function DayPlanCard({
  dayPlan,
  dayNumber,
  isToday = false,
  isPast = false,
  onPress,
  onMarkComplete,
  onAddExpense,
  showAddExpense = false,
}: DayPlanCardProps) {
  const theme = useTheme();
  const restDay = isRestDay(dayPlan);
  const isCompleted = dayPlan.status === 'completed';

  // Get status config
  const getStatusConfig = () => {
    if (restDay && !isCompleted) {
      return REST_DAY_CONFIG;
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

  // Determine left accent color based on state
  const getAccentColor = () => {
    if (isToday) return colors.status.warning;
    if (isCompleted) return colors.status.success;
    if (isPast && !isCompleted) return colors.neutral[300];
    return colors.secondary[400];
  };

  // Only show Add Expense on today, completed, or in_progress days
  const shouldShowExpense = showAddExpense && onAddExpense &&
    (isToday || isCompleted || dayPlan.status === 'in_progress');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
        isPast && !isCompleted && !isToday && styles.pastContainer,
        isToday && styles.todayContainer,
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: getAccentColor() }]} />

      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.dayInfo}>
            <View style={styles.dayRow}>
              <Text
                variant="titleMedium"
                style={[
                  styles.dayTitle,
                  isPast && !isCompleted && !isToday && styles.mutedText
                ]}
              >
                Day {dayNumber}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}
            </View>
            <Text
              variant="bodySmall"
              style={[
                styles.dateText,
                { color: theme.colors.onSurfaceVariant },
                isPast && !isToday && styles.mutedText
              ]}
            >
              {formatDate(dayPlan.date)}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Status badge - small and subtle */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <MaterialCommunityIcons
                name={statusConfig.icon as any}
                size={12}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            {onPress && (
              <IconButton
                icon="pencil-outline"
                size={18}
                iconColor={colors.neutral[400]}
                style={styles.editButton}
                onPress={onPress}
              />
            )}
          </View>
        </View>

        {/* Main content - compact for rest days */}
        {restDay ? (
          <View style={styles.restDayRow}>
            <MaterialCommunityIcons
              name="coffee"
              size={16}
              color={colors.neutral[400]}
            />
            <Text variant="bodySmall" style={styles.restDayText}>
              Rest day
            </Text>
          </View>
        ) : (
          <View style={styles.distanceRow}>
            <MaterialCommunityIcons
              name="bike"
              size={18}
              color={isPast && !isToday ? colors.neutral[400] : colors.neutral[600]}
            />
            <Text
              variant="bodyLarge"
              style={[
                styles.distanceText,
                isPast && !isToday && styles.mutedText
              ]}
            >
              {Math.round(dayPlan.targetKm)} km
            </Text>
            {dayPlan.actualKm !== null && (
              <View style={styles.actualBadge}>
                <Text style={styles.actualText}>
                  {dayPlan.actualKm} km done
                </Text>
              </View>
            )}
            {dayPlan.euroVeloSegment && (
              <Text variant="bodySmall" style={styles.segmentText}>
                km {Math.round(dayPlan.euroVeloSegment.startKm)}-{Math.round(dayPlan.euroVeloSegment.endKm)}
              </Text>
            )}
          </View>
        )}

        {/* Notes - only if present and meaningful */}
        {dayPlan.notes && dayPlan.notes.length > 0 && dayPlan.notes !== 'Rest day' && (
          <View style={styles.notesRow}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={12}
              color={colors.neutral[400]}
            />
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={styles.notesText}
            >
              {dayPlan.notes}
            </Text>
          </View>
        )}

        {/* Action buttons - only show when relevant */}
        {isToday && dayPlan.status === 'planned' && onMarkComplete && !restDay && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={onMarkComplete}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
            <Text style={styles.completeButtonText}>Complete Day</Text>
          </TouchableOpacity>
        )}

        {shouldShowExpense && (
          <TouchableOpacity
            style={styles.expenseButton}
            onPress={onAddExpense}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="wallet-plus-outline" size={16} color={colors.primary[600]} />
            <Text style={styles.expenseButtonText}>Add Expense</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
    overflow: 'hidden',
  },
  pastContainer: {
    opacity: 0.6,
  },
  todayContainer: {
    ...shadows.md,
    borderWidth: 0,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayInfo: {
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayTitle: {
    fontWeight: '600',
    color: colors.neutral[800],
  },
  dateText: {
    marginTop: 2,
  },
  mutedText: {
    color: colors.neutral[400],
  },
  todayBadge: {
    backgroundColor: colors.status.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  todayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  editButton: {
    margin: -8,
  },
  restDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  restDayText: {
    color: colors.neutral[400],
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  distanceText: {
    fontWeight: '600',
    color: colors.neutral[700],
  },
  actualBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  actualText: {
    fontSize: 11,
    color: colors.status.success,
    fontWeight: '500',
  },
  segmentText: {
    color: colors.neutral[400],
    fontSize: 11,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  notesText: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: 12,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.status.warning,
    borderRadius: borderRadius.xl,
    // Shadow for depth - makes it look tappable
    shadowColor: colors.status.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  expenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  expenseButtonText: {
    color: colors.primary[600],
    fontSize: 13,
    fontWeight: '500',
  },
});
