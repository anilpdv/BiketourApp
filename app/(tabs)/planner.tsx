import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { EmptyState } from '../../src/shared/components';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/shared/design/tokens';

type Plan = {
  id: string;
  date: string;
  targetKm: number;
  status: 'completed' | 'planned' | 'skipped';
  actualKm?: number;
};

const STATUS_COLORS = {
  completed: colors.status.success,
  skipped: colors.status.warning,
  planned: colors.primary[500],
};

export default function PlannerScreen() {
  const [dailyTarget, setDailyTarget] = useState(80);
  const [plans] = useState<Plan[]>([]);

  const totalPlanned = plans.reduce((sum, p) => sum + p.targetKm, 0);
  const totalCompleted = plans
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.actualKm || 0), 0);

  const getStatusColor = (status: Plan['status']) => {
    return STATUS_COLORS[status] || colors.primary[500];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>km cycled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalPlanned}</Text>
          <Text style={styles.statLabel}>km planned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{plans.filter(p => p.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>days done</Text>
        </View>
      </View>

      <View style={styles.targetSection}>
        <Text style={styles.sectionTitle}>Daily Target</Text>
        <View style={styles.targetRow}>
          <TouchableOpacity
            style={styles.targetButton}
            onPress={() => setDailyTarget(Math.max(20, dailyTarget - 10))}
          >
            <Text style={styles.targetButtonText}>-10</Text>
          </TouchableOpacity>
          <View style={styles.targetDisplay}>
            <Text style={styles.targetValue}>{dailyTarget}</Text>
            <Text style={styles.targetUnit}>km/day</Text>
          </View>
          <TouchableOpacity
            style={styles.targetButton}
            onPress={() => setDailyTarget(Math.min(200, dailyTarget + 10))}
          >
            <Text style={styles.targetButtonText}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Upcoming Days</Text>
        {plans.length === 0 ? (
          <EmptyState
            icon="🚴"
            title="No trip plans yet"
            subtitle="Start planning your bike tour by adding daily targets"
          />
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planCardLeft}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(plan.status) }]} />
                <View>
                  <Text style={styles.planDate}>{plan.date}</Text>
                  <Text style={styles.planTarget}>Target: {plan.targetKm} km</Text>
                  {plan.actualKm && (
                    <Text style={styles.planActual}>Actual: {plan.actualKm} km</Text>
                  )}
                </View>
              </View>
              <View style={styles.planCardRight}>
                <Text style={[styles.planStatus, { color: getStatusColor(plan.status) }]}>
                  {plan.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>+ Add Day Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Text style={styles.actionButtonTextSecondary}>View Statistics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.primary[500],
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  targetSection: {
    backgroundColor: colors.neutral[0],
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetButtonText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  targetDisplay: {
    alignItems: 'center',
    marginHorizontal: spacing['2xl'],
  },
  targetValue: {
    fontSize: 48,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  targetUnit: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
  },
  plansSection: {
    paddingHorizontal: spacing.lg,
  },
  planCard: {
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  planDate: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  planTarget: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  planActual: {
    fontSize: typography.fontSizes.base,
    color: colors.status.success,
    marginTop: spacing.xs,
  },
  planCardRight: {
    alignItems: 'flex-end',
  },
  planStatus: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary[500],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  actionButtonSecondary: {
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  actionButtonTextSecondary: {
    color: colors.primary[500],
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
});
