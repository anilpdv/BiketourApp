import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { TabParamList } from './types';

import { MapScreen } from '../features/map/screens/MapScreen';
import { RoutesListScreen } from '../features/routes/screens/RoutesListScreen';
import { JournalScreen } from '../features/journal/screens/JournalScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';

// Note: PlannerScreen is now handled by Expo Router at app/(tabs)/planner.tsx
// This legacy TabNavigator is kept for reference only
const PlannerScreen = () => null;

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    MapTab: '🗺️',
    RoutesTab: '🚴',
    PlannerTab: '📅',
    JournalTab: '📔',
    SettingsTab: '⚙️',
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icons[name]}
    </Text>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="RoutesTab"
        component={RoutesListScreen}
        options={{ tabBarLabel: 'Routes' }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerScreen}
        options={{ tabBarLabel: 'Planner' }}
      />
      <Tab.Screen
        name="JournalTab"
        component={JournalScreen}
        options={{ tabBarLabel: 'Journal' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
