import React, { memo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { getRouteName, ROUTE_CONFIGS } from '../../routes/services/routeLoader.service';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

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
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableRouteIds.map((id) => {
          const config = ROUTE_CONFIGS[id];
          const routeColor = config?.color || colors.neutral[400];
          const isEnabled = enabledRouteIds.includes(id);
          const isSelected = selectedRouteId === id;
          const isLoadingThis = isLoading && enabledRouteIds.includes(id) && !loadedRouteIds.includes(id);

          return (
            <View key={id} style={styles.chipWrapper}>
              <Chip
                mode={isEnabled ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => onToggleRoute(id)}
                icon={() => (
                  <View style={[styles.dot, { backgroundColor: routeColor }]} />
                )}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary[100]
                      : isEnabled
                      ? colors.primary[50]
                      : theme.colors.surface,
                    borderColor: routeColor,
                    borderWidth: isSelected ? 3 : 2,
                  },
                ]}
                textStyle={[
                  styles.chipText,
                  isEnabled && styles.chipTextEnabled,
                ]}
                selectedColor={routeColor}
                showSelectedCheck={false}
                elevated={!isEnabled}
                elevation={isEnabled ? 0 : 1}
                accessibilityLabel={`EuroVelo route ${id}, ${isEnabled ? 'enabled' : 'disabled'}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: false }}
              >
                EV{id}
              </Chip>
              {isLoadingThis && (
                <ActivityIndicator
                  size="small"
                  color={routeColor}
                  style={styles.loader}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    borderRadius: borderRadius['2xl'],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  chipTextEnabled: {
    color: colors.primary[700],
    fontWeight: '700',
  },
  loader: {
    marginLeft: spacing.xs,
  },
});
