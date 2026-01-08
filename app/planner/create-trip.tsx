import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  Button,
  TextInput,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePlannerStore } from '../../src/features/planner/store/plannerStore';
import { useSavedRoutesStore } from '../../src/features/routing/store/savedRoutesStore';
import {
  loadRoute,
  getRouteName,
  getRouteColor,
  getRouteMetadata,
  getAvailableRouteIds,
} from '../../src/features/routes/services/routeLoader.service';
import { customRouteToPlannableRoute } from '../../src/features/planner/services/routeAdapter';
import { ParsedRoute } from '../../src/features/routes/types';
import { CustomRoute } from '../../src/features/routing/types';
import { RouteSource } from '../../src/features/planner/types';
import { colors, spacing, borderRadius } from '../../src/shared/design/tokens';

type RouteSourceType = 'eurovelo' | 'custom' | 'import';

export default function CreateTripScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { createTripPlanFromAnyRoute, setActiveTripPlan } = usePlannerStore();
  const { routes: savedRoutes, loadRoutes, openRoute, importRoute } = useSavedRoutesStore();

  // Route source state
  const [routeSourceType, setRouteSourceType] = useState<RouteSourceType>('eurovelo');
  const [routeSource, setRouteSource] = useState<RouteSource | null>(null);

  // Form state
  const [selectedRoute, setSelectedRoute] = useState<ParsedRoute | null>(null);
  const [selectedEuroVeloId, setSelectedEuroVeloId] = useState<number | null>(null);
  const [selectedCustomRouteId, setSelectedCustomRouteId] = useState<string | null>(null);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [dailyKm, setDailyKm] = useState(80);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showRouteList, setShowRouteList] = useState(false);

  // Load saved routes on mount
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Calculate estimated days
  const estimatedDays = useMemo(() => {
    if (!selectedRoute) return 0;
    return Math.ceil(selectedRoute.totalDistance / dailyKm);
  }, [selectedRoute, dailyKm]);

  // Calculate end date
  const endDate = useMemo(() => {
    if (estimatedDays <= 0) return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + estimatedDays - 1);
    return end;
  }, [startDate, estimatedDays]);

  const handleSelectEuroVeloRoute = async (euroVeloId: number) => {
    setIsLoadingRoute(true);
    setSelectedEuroVeloId(euroVeloId);
    setSelectedCustomRouteId(null);
    setShowRouteList(false);

    try {
      // Try to load developed version first, fallback to full
      let route = await loadRoute(euroVeloId, 'developed');
      const variant = route ? 'developed' : 'full';
      if (!route) {
        route = await loadRoute(euroVeloId, 'full');
      }
      if (route) {
        setSelectedRoute(route);
        setTripName(`${route.name} Trip`);
        setRouteSource({ type: 'eurovelo', euroVeloId, variant });
      }
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleSelectCustomRoute = async (customRouteId: string) => {
    setIsLoadingRoute(true);
    setSelectedCustomRouteId(customRouteId);
    setSelectedEuroVeloId(null);
    setShowRouteList(false);

    try {
      const customRoute = await openRoute(customRouteId);
      if (customRoute) {
        // Convert CustomRoute to ParsedRoute format
        const parsedRoute = customRouteToPlannableRoute(customRoute);
        setSelectedRoute(parsedRoute);
        setTripName(`${customRoute.name} Trip`);
        setRouteSource({ type: 'custom', customRouteId });
      }
    } catch (error) {
      console.error('Failed to load custom route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleImportRoute = async () => {
    setIsLoadingRoute(true);
    try {
      const importedRoute = await importRoute();
      if (importedRoute) {
        // Convert imported CustomRoute to ParsedRoute format
        const parsedRoute = customRouteToPlannableRoute(importedRoute);
        setSelectedRoute(parsedRoute);
        setTripName(`${importedRoute.name} Trip`);
        setRouteSource({ type: 'imported', name: importedRoute.name });
        setSelectedCustomRouteId(importedRoute.id);
        setSelectedEuroVeloId(null);
      }
    } catch (error) {
      console.error('Failed to import route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!selectedRoute || !routeSource) return;

    const tripPlan = await createTripPlanFromAnyRoute(
      selectedRoute,
      routeSource,
      startDate.toISOString().split('T')[0],
      dailyKm,
      tripName || undefined
    );

    setActiveTripPlan(tripPlan);
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Route Source Type Selector */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Route Source
        </Text>
        <SegmentedButtons
          value={routeSourceType}
          onValueChange={(value) => {
            setRouteSourceType(value as RouteSourceType);
            setShowRouteList(false);
          }}
          buttons={[
            { value: 'eurovelo', label: 'EuroVelo' },
            { value: 'custom', label: 'My Routes' },
            { value: 'import', label: 'Import' },
          ]}
          style={styles.segmentedButtons}
        />
      </Surface>

      {/* Route Selection */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Select Route
        </Text>

        {selectedRoute ? (
          <TouchableOpacity
            style={styles.selectedRoute}
            onPress={() => setShowRouteList(true)}
          >
            <View
              style={[
                styles.routeIndicator,
                { backgroundColor: getRouteColor(selectedRoute.euroVeloId, selectedRoute.variant) },
              ]}
            />
            <View style={styles.routeInfo}>
              <Text variant="titleSmall">{selectedRoute.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {Math.round(selectedRoute.totalDistance)} km total
              </Text>
            </View>
            <MaterialCommunityIcons
              name="pencil"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <>
            {/* EuroVelo route selection */}
            {routeSourceType === 'eurovelo' && (
              <Button
                mode="outlined"
                onPress={() => setShowRouteList(true)}
                icon="map-marker-path"
                loading={isLoadingRoute}
              >
                Choose EuroVelo Route
              </Button>
            )}

            {/* Custom route selection */}
            {routeSourceType === 'custom' && (
              <Button
                mode="outlined"
                onPress={() => setShowRouteList(true)}
                icon="routes"
                loading={isLoadingRoute}
              >
                Choose Saved Route
              </Button>
            )}

            {/* Import GPX */}
            {routeSourceType === 'import' && (
              <Button
                mode="outlined"
                onPress={handleImportRoute}
                icon="file-import"
                loading={isLoadingRoute}
              >
                Import GPX File
              </Button>
            )}
          </>
        )}

        {/* EuroVelo route list */}
        {showRouteList && routeSourceType === 'eurovelo' && (
          <View style={styles.routeList}>
            {getAvailableRouteIds().map((euroVeloId) => {
              const name = getRouteName(euroVeloId);
              const color = getRouteColor(euroVeloId, 'developed');
              const metadata = getRouteMetadata(euroVeloId);

              return (
                <TouchableOpacity
                  key={euroVeloId}
                  style={[
                    styles.routeItem,
                    selectedEuroVeloId === euroVeloId && styles.routeItemSelected,
                  ]}
                  onPress={() => handleSelectEuroVeloRoute(euroVeloId)}
                >
                  <View style={[styles.routeColorDot, { backgroundColor: color }]} />
                  <View style={styles.routeItemInfo}>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      EV{euroVeloId} - {name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {metadata.distance} km • {metadata.countries} countries
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Custom routes list */}
        {showRouteList && routeSourceType === 'custom' && (
          <View style={styles.routeList}>
            {savedRoutes.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="map-marker-off"
                  size={32}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
                >
                  No saved routes yet
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                >
                  Draw a route on the map and save it to use it here
                </Text>
              </View>
            ) : (
              savedRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routeItem,
                    selectedCustomRouteId === route.id && styles.routeItemSelected,
                  ]}
                  onPress={() => handleSelectCustomRoute(route.id)}
                >
                  <View style={[styles.routeColorDot, { backgroundColor: '#4A90D9' }]} />
                  <View style={styles.routeItemInfo}>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {route.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {Math.round(route.distance / 1000)} km • {route.mode}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </Surface>

      {/* Trip Name */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Trip Name
        </Text>
        <TextInput
          value={tripName}
          onChangeText={setTripName}
          placeholder="e.g., Summer 2024 Adventure"
          mode="outlined"
        />
      </Surface>

      {/* Start Date */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Start Date
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={theme.colors.primary}
          />
          <Text variant="bodyLarge" style={styles.dateText}>
            {formatDate(startDate)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event: unknown, date?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setStartDate(date);
            }}
            minimumDate={new Date()}
          />
        )}
      </Surface>

      {/* Daily Distance */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Daily Distance Target
        </Text>
        <View style={styles.stepperRow}>
          <IconButton
            icon="minus-circle"
            size={40}
            iconColor={dailyKm <= 40 ? colors.neutral[300] : theme.colors.primary}
            onPress={() => setDailyKm(Math.max(40, dailyKm - 10))}
            disabled={dailyKm <= 40}
          />
          <View style={styles.sliderContainer}>
            <Text variant="displaySmall" style={[styles.kmValue, { color: theme.colors.primary }]}>
              {dailyKm}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              km per day
            </Text>
          </View>
          <IconButton
            icon="plus-circle"
            size={40}
            iconColor={dailyKm >= 150 ? colors.neutral[300] : theme.colors.primary}
            onPress={() => setDailyKm(Math.min(150, dailyKm + 10))}
            disabled={dailyKm >= 150}
          />
        </View>
        <View style={styles.sliderLabels}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            40 km (Easy)
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            150 km (Pro)
          </Text>
        </View>
      </Surface>

      {/* Trip Summary */}
      {selectedRoute && (
        <Surface style={[styles.section, styles.summarySection]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Trip Summary
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
                {estimatedDays}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                days
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
                {Math.round(selectedRoute.totalDistance)}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                total km
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="flag-checkered"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="bodySmall" style={{ fontWeight: '600', textAlign: 'center' }}>
                {endDate ? formatDate(endDate).split(',')[0] : '-'}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                end date
              </Text>
            </View>
          </View>
        </Surface>
      )}

      {/* Create Button */}
      <Button
        mode="contained"
        onPress={handleCreateTrip}
        disabled={!selectedRoute}
        style={styles.createButton}
        contentStyle={styles.createButtonContent}
        icon="check"
      >
        Create Trip Plan
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  selectedRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  routeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  routeItemSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  routeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  routeItemInfo: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  dateText: {
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sliderContainer: {
    alignItems: 'center',
    minWidth: 100,
  },
  kmValue: {
    fontWeight: '700',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summarySection: {
    backgroundColor: colors.primary[50],
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  createButton: {
    marginTop: spacing.lg,
  },
  createButtonContent: {
    paddingVertical: spacing.sm,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
});
