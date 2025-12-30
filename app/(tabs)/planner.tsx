import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Card,
  Chip,
  useTheme,
} from 'react-native-paper';
import { EmptyState, StatsHeader, ErrorBoundary } from '../../src/shared/components';
import { Button } from '../../src/shared/components/Button';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

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
  const theme = useTheme();
  const [dailyTarget, setDailyTarget] = useState(80);
  const [plans] = useState<Plan[]>([]);

  const stats = useMemo(() => {
    const totalPlanned = plans.reduce((sum, p) => sum + p.targetKm, 0);
    const totalCompleted = plans
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.actualKm || 0), 0);
    const daysCompleted = plans.filter(p => p.status === 'completed').length;

    return [
      { value: totalCompleted, label: 'km cycled' },
      { value: totalPlanned, label: 'km planned' },
      { value: daysCompleted, label: 'days done' },
    ];
  }, [plans]);

  const getStatusColor = (status: Plan['status']) => {
    return STATUS_COLORS[status] || colors.primary[500];
  };

  return (
    <ErrorBoundary>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatsHeader stats={stats} backgroundColor={theme.colors.primary} />

        <Surface style={styles.targetSection} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Daily Target
          </Text>
          <View style={styles.targetRow}>
            <IconButton
              icon="minus"
              mode="contained-tonal"
              size={28}
              onPress={() => setDailyTarget(Math.max(20, dailyTarget - 10))}
            />
            <View style={styles.targetDisplay}>
              <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {dailyTarget}
              </Text>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                km/day
              </Text>
            </View>
            <IconButton
              icon="plus"
              mode="contained-tonal"
              size={28}
              onPress={() => setDailyTarget(Math.min(200, dailyTarget + 10))}
            />
          </View>
        </Surface>

        <View style={styles.plansSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming Days
          </Text>
          {plans.length === 0 ? (
            <EmptyState
              icon="🚴"
              title="No trip plans yet"
              subtitle="Start planning your bike tour by adding daily targets"
            />
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} mode="elevated" style={styles.planCard}>
                <Card.Content style={styles.planCardContent}>
                  <View style={styles.planCardLeft}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(plan.status) }]} />
                    <View>
                      <Text variant="titleSmall">{plan.date}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Target: {plan.targetKm} km
                      </Text>
                      {plan.actualKm && (
                        <Text variant="bodySmall" style={{ color: colors.status.success }}>
                          Actual: {plan.actualKm} km
                        </Text>
                      )}
                    </View>
                  </View>
                  <Chip
                    compact
                    mode="flat"
                    style={{ backgroundColor: `${getStatusColor(plan.status)}20` }}
                    textStyle={{ color: getStatusColor(plan.status), textTransform: 'capitalize' }}
                  >
                    {plan.status}
                  </Chip>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={styles.actionsSection}>
          <Button
            label="+ Add Day Plan"
            onPress={() => {}}
            variant="primary"
            size="lg"
          />
          <Button
            label="View Statistics"
            onPress={() => {}}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  targetSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetDisplay: {
    alignItems: 'center',
    marginHorizontal: spacing['2xl'],
  },
  plansSection: {
    paddingHorizontal: spacing.lg,
  },
  planCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  planCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
