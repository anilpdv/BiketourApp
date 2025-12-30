import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Tab Navigator
export type TabParamList = {
  MapTab: undefined;
  RoutesTab: undefined;
  PlannerTab: undefined;
  JournalTab: undefined;
  SettingsTab: undefined;
};

// Stack Navigators for each tab
export type MapStackParamList = {
  Map: undefined;
  POIDetail: { poiId: string };
  OfflineManager: undefined;
};

export type RoutesStackParamList = {
  RoutesList: undefined;
  RouteDetail: { routeId: string };
};

export type PlannerStackParamList = {
  PlannerHome: undefined;
  DayPlanDetail: { planId: string };
  CreateDayPlan: { date: string; routeId: string };
  Statistics: undefined;
};

export type JournalStackParamList = {
  JournalHome: undefined;
  EntryDetail: { entryId: string };
  CreateEntry: { date?: string };
  EditEntry: { entryId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  OfflineData: undefined;
  About: undefined;
};

// Screen props types
export type MapScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MapStackParamList>,
  BottomTabScreenProps<TabParamList>
>;

export type RoutesScreenProps = CompositeScreenProps<
  NativeStackScreenProps<RoutesStackParamList>,
  BottomTabScreenProps<TabParamList>
>;

export type PlannerScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PlannerStackParamList>,
  BottomTabScreenProps<TabParamList>
>;

export type JournalScreenProps = CompositeScreenProps<
  NativeStackScreenProps<JournalStackParamList>,
  BottomTabScreenProps<TabParamList>
>;

export type SettingsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList>,
  BottomTabScreenProps<TabParamList>
>;
