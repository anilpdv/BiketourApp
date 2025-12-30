import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  useSavedRoutesStore,
  EuroVeloRoutesList,
  MyRoutesList,
} from '../../src/features/routing';
import { colors, spacing, typography, borderRadius } from '../../src/shared/design/tokens';

type TabType = 'eurovelo' | 'myroutes';

export default function RoutesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('eurovelo');
  const { routes: savedRoutes } = useSavedRoutesStore();

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'eurovelo' && styles.tabActive]}
          onPress={() => setActiveTab('eurovelo')}
        >
          <Text style={[styles.tabText, activeTab === 'eurovelo' && styles.tabTextActive]}>
            EuroVelo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myroutes' && styles.tabActive]}
          onPress={() => setActiveTab('myroutes')}
        >
          <Text style={[styles.tabText, activeTab === 'myroutes' && styles.tabTextActive]}>
            My Routes
          </Text>
          {savedRoutes.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{savedRoutes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  tabTextActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeights.semibold,
  },
  badge: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  listScreen: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    padding: spacing.lg,
  },
});
