import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getRouteName, ROUTE_CONFIGS } from '../../routes/services/routeLoader.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface RouteChipSelectorProps {
  availableRouteIds: number[];
  enabledRouteIds: number[];
  selectedRouteId: number | null;
  loadedRouteIds: number[];
  isLoading: boolean;
  onToggleRoute: (euroVeloId: number) => void;
}

/**
 * Horizontal scrolling route selector chips
 */
export const RouteChipSelector = memo(function RouteChipSelector({
  availableRouteIds,
  enabledRouteIds,
  selectedRouteId,
  loadedRouteIds,
  isLoading,
  onToggleRoute,
}: RouteChipSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableRouteIds.map((id) => {
          const config = ROUTE_CONFIGS[id];
          const isEnabled = enabledRouteIds.includes(id);
          const isSelected = selectedRouteId === id;
          const isLoadingThis = isLoading && enabledRouteIds.includes(id) && !loadedRouteIds.includes(id);

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.chip,
                isEnabled && styles.chipEnabled,
                isSelected && styles.chipSelected,
                { borderColor: config?.color || colors.neutral[300] },
              ]}
              onPress={() => onToggleRoute(id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: config?.color || colors.neutral[400] }]} />
              <Text style={[styles.chipText, isEnabled && styles.chipTextEnabled]}>
                EV{id}
              </Text>
              {isLoadingThis && (
                <ActivityIndicator size="small" color={config?.color || colors.primary[500]} style={styles.loader} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    ...shadows.md,
  },
  chipEnabled: {
    backgroundColor: colors.primary[50],
  },
  chipSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[600],
  },
  chipTextEnabled: {
    color: colors.primary[700],
    fontWeight: typography.fontWeights.bold,
  },
  loader: {
    marginLeft: spacing.xs,
  },
});
