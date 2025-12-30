import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SegmentedButtons, Badge, useTheme } from 'react-native-paper';
import {
  useSavedRoutesStore,
  EuroVeloRoutesList,
  MyRoutesList,
} from '../../src/features/routing';
import { ErrorBoundary } from '../../src/shared/components';
import { colors, spacing } from '../../src/shared/design/tokens';

type TabType = 'eurovelo' | 'myroutes';

export default function RoutesScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('eurovelo');
  const { routes: savedRoutes } = useSavedRoutesStore();

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Segmented tab bar */}
        <View style={[styles.tabBarContainer, { backgroundColor: theme.colors.surface }]}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            buttons={[
              {
                value: 'eurovelo',
                label: 'EuroVelo',
                icon: 'road-variant',
              },
              {
                value: 'myroutes',
                label: `My Routes${savedRoutes.length > 0 ? ` (${savedRoutes.length})` : ''}`,
                icon: 'bookmark-outline',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.listScreen}>
          {activeTab === 'eurovelo' ? (
            <EuroVeloRoutesList />
          ) : (
            <MyRoutesList />
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  segmentedButtons: {
    alignSelf: 'center',
  },
  listScreen: {
    flex: 1,
    padding: spacing.lg,
  },
});
