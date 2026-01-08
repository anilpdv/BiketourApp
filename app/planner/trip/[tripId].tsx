import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  ProgressBar,
  Button,
  Chip,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlannerStore, selectTripPlanById } from '../../../src/features/planner/store/plannerStore';
import { DayPlanCard } from '../../../src/features/planner/components/DayPlanCard';
import { calculateTripStats } from '../../../src/features/planner/services/euroveloPlanningService';
import { getRouteName, getRouteColor } from '../../../src/features/routes/services/routeLoader.service';
import { DayPlan } from '../../../src/features/planner/types';
import { colors, spacing, borderRadius } from '../../../src/shared/design/tokens';

export default function TripDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));
  const { setActiveTripPlan, deleteTripPlan, completeTripDayPlan } = usePlannerStore();

  const [menuVisible, setMenuVisible] = useState(false);

  const stats = useMemo(() => {
    if (!tripPlan) return null;
    return calculateTripStats(tripPlan);
  }, [tripPlan]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  if (!tripPlan) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="bodyLarge">Trip not found</Text>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          Go Back
        </Button>
      </View>
    );
  }

  const routeColor = getRouteColor(tripPlan.euroVeloId, tripPlan.variant);
  const routeName = getRouteName(tripPlan.euroVeloId);

  const handleSetActive = () => {
    setActiveTripPlan(tripPlan);
    router.back();
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip plan? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTripPlan(tripPlan.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkDayComplete = (dayPlan: DayPlan) => {
    Alert.prompt(
      'Complete Day',
      `Enter actual km ridden (target: ${dayPlan.targetKm} km)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: (actualKm: string | undefined) => {
            const km = parseFloat(actualKm || String(dayPlan.targetKm));
            if (!isNaN(km)) {
              completeTripDayPlan(tripPlan.id, dayPlan.id, km);
            }
          },
        },
      ],
      'plain-text',
      String(dayPlan.targetKm)
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Trip Info Card */}
      <Surface style={styles.infoCard} elevation={2}>
        <View style={styles.infoHeader}>
          <View style={[styles.routeIndicator, { backgroundColor: routeColor }]} />
          <View style={styles.infoHeaderText}>
            <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
              {tripPlan.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              EuroVelo {tripPlan.euroVeloId} - {routeName}
            </Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleSetActive();
              }}
              title="Set as Active"
              leadingIcon="check-circle"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleDeleteTrip();
              }}
              title="Delete Trip"
              leadingIcon="delete"
              titleStyle={{ color: colors.status.error }}
            />
          </Menu>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              {stats ? Math.round(stats.completedKm) : 0}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              km done
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ fontWeight: '600' }}>
              {Math.round(tripPlan.totalDistanceKm)}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              km total
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ fontWeight: '600' }}>
              {tripPlan.dailyDistanceKm}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              km/day
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="labelMedium">Progress</Text>
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
              {stats ? Math.round(stats.progressPercent) : 0}%
            </Text>
          </View>
          <ProgressBar
            progress={(stats?.progressPercent || 0) / 100}
            color={routeColor}
            style={styles.progressBar}
          />
        </View>

        {/* Date Range */}
        <View style={styles.dateRow}>
          <MaterialCommunityIcons
            name="calendar-range"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.xs }}>
            {formatDate(tripPlan.startDate)} - {tripPlan.endDate ? formatDate(tripPlan.endDate) : 'TBD'}
            {' '}({tripPlan.estimatedDays} days)
          </Text>
        </View>

        {/* Status Chip */}
        <View style={styles.statusRow}>
          <Chip
            mode="flat"
            style={{ backgroundColor: `${routeColor}20` }}
            textStyle={{ color: routeColor, textTransform: 'capitalize' }}
          >
            {tripPlan.status}
          </Chip>
        </View>
      </Surface>

      {/* Day Plans Header */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Day-by-Day Schedule
      </Text>
    </View>
  );

  const renderDayPlan = ({ item, index }: { item: DayPlan; index: number }) => {
    const isToday = item.date === today;
    const canComplete = item.status === 'planned' || item.status === 'in_progress';

    return (
      <DayPlanCard
        dayPlan={item}
        dayNumber={index + 1}
        isToday={isToday}
        onMarkComplete={canComplete ? () => handleMarkDayComplete(item) : undefined}
      />
    );
  };

  return (
    <FlatList
      data={tripPlan.dayPlans}
      keyExtractor={(item) => item.id}
      renderItem={renderDayPlan}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  headerSection: {
    marginBottom: spacing.md,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  routeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  infoHeaderText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[200],
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});
