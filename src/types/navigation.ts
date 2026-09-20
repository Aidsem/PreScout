import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export interface FocusDetection {
  id: string;
  latitude: number;
  longitude: number;
}

export interface MissionAssignment {
  droneUnitId: string;
  roverUnitId: string;
}

export type MainTabParamList = {
  CommandTab: undefined;
  LiveMap: { focusDetection?: FocusDetection; missionAssignment?: MissionAssignment } | undefined;
  MissionsTab: undefined;
  AssetsTab: undefined;
  HistoryTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateIncident: undefined;
  LiveMonitoring: undefined;
  DetectionDetails: { alertId?: string } | undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
