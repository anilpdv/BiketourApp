import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  useSavedRoutesStore,
  EuroVeloRoutesList,
  MyRoutesList,
} from '../../src/features/routing';
import { ErrorBoundary } from '../../src/shared/components';
import { colors, spacing, typography } from '../../src/shared/design/tokens';

type TabType = 'eurovelo' | 'myroutes';

interface TabConfig {
  key: TabType;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: 'eurovelo', label: 'EuroVelo', icon: 'road-variant' },
  { key: 'myroutes', label: 'My Routes', icon: 'bookmark-outline' },
];

export default function RoutesScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('eurovelo');
  const [refreshing, setRefreshing] = useState(false);
  const { routes: savedRoutes, loadRoutes } = useSavedRoutesStore();
  const [tabWidths, setTabWidths] = useState<number[]>([0, 0]);

  // Animated indicator position
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const handleTabPress = useCallback(
    (tab: TabType, index: number) => {
      setActiveTab(tab);
      // Calculate position based on previous tab widths
      const position = tabWidths.slice(0, index).reduce((acc, w) => acc + w, 0);
      indicatorPosition.value = withTiming(position, {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      indicatorWidth.value = withTiming(tabWidths[index], {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    },
    [tabWidths, indicatorPosition, indicatorWidth]
  );

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setTabWidths((prev) => {
        const newWidths = [...prev];
        newWidths[index] = width;
        // Set initial indicator width for first tab
        if (index === 0 && indicatorWidth.value === 0) {
          indicatorWidth.value = width;
        }
        return newWidths;
      });
    },
    [indicatorWidth]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.neutral[0] }]}
        edges={['top']}
      >
        {/* Custom Tab Bar */}
        <View style={styles.tabBar}>
          <View style={styles.tabsContainer}>
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.key;
              const showBadge = tab.key === 'myroutes' && savedRoutes.length > 0;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.key, index)}
                  onLayout={(e) => handleTabLayout(index, e)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={20}
                    color={isActive ? colors.primary[600] : colors.neutral[500]}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{savedRoutes.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Animated indicator */}
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.listScreen}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            activeTab === 'myroutes' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary[500]}
              />
            ) : undefined
          }
        >
          {activeTab === 'eurovelo' ? <EuroVeloRoutesList /> : <MyRoutesList />}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
  },
  tabLabelActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeights.semibold,
  },
  badge: {
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: {
    color: colors.neutral[0],
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: colors.primary[500],
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  listScreen: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
