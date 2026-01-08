import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme, IconButton, Menu, Text } from 'react-native-paper';
import { MaterialTopTabs } from '../../../../src/shared/navigation';
import { usePlannerStore, selectTripPlanById } from '../../../../src/features/planner/store/plannerStore';
import { colors, spacing } from '../../../../src/shared/design/tokens';
import { TripContext } from './TripContext';

export default function TripTabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [menuVisible, setMenuVisible] = useState(false);

  const tripPlan = usePlannerStore((state) => selectTripPlanById(tripId || '')(state));
  const { setActiveTripPlan, deleteTripPlan } = usePlannerStore();

  const handleSetActive = () => {
    if (tripPlan) {
      setActiveTripPlan(tripPlan);
      setMenuVisible(false);
    }
  };

  const handleDeleteTrip = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip plan? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (tripPlan) {
              deleteTripPlan(tripPlan.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!tripPlan) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  return (
    <TripContext.Provider value={{ tripId: tripId! }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onPrimary}
            onPress={() => router.back()}
          />
          <Text
            variant="titleMedium"
            style={[styles.headerTitle, { color: theme.colors.onPrimary }]}
            numberOfLines={1}
          >
            {tripPlan.name}
          </Text>
          <View style={styles.headerRight}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  iconColor={theme.colors.onPrimary}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={handleSetActive}
                title="Set as Active"
                leadingIcon="check-circle"
              />
              <Menu.Item
                onPress={handleDeleteTrip}
                title="Delete Trip"
                leadingIcon="delete"
                titleStyle={{ color: colors.status.error }}
              />
            </Menu>
          </View>
        </View>

        <MaterialTopTabs
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
            tabBarStyle: { backgroundColor: theme.colors.surface },
            tabBarLabelStyle: { fontWeight: '600', textTransform: 'none' },
          }}
        >
          <MaterialTopTabs.Screen
            name="index"
            options={{ title: 'Overview' }}
          />
          <MaterialTopTabs.Screen
            name="schedule"
            options={{ title: 'Schedule' }}
          />
          <MaterialTopTabs.Screen
            name="expenses"
            options={{ title: 'Expenses' }}
          />
        </MaterialTopTabs>
      </SafeAreaView>
    </TripContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
