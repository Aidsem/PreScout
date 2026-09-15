import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { CommandCenterScreen } from '../screens/CommandCenterScreen';
import { LiveMapScreen } from '../screens/LiveMapScreen';
import { LiveMonitoringScreen } from '../screens/LiveMonitoringScreen';
import { DetectionDetailsScreen } from '../screens/DetectionDetailsScreen';
import { CreateIncidentScreen } from '../screens/CreateIncidentScreen';
import { AssetSelectionScreen } from '../screens/AssetSelectionScreen';
import { MissionPlanningScreen } from '../screens/MissionPlanningScreen';
import { MissionHistoryScreen } from '../screens/MissionHistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surfaceContainer,
          borderTopWidth: 1,
          borderTopColor: Colors.outlineVariant,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.tertiary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="CommandTab"
        component={CommandCenterScreen}
        options={{
          tabBarLabel: 'COMMAND',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LiveMap"
        component={LiveMapScreen}
        options={{
          tabBarLabel: 'MAP',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-legend" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MissionsTab"
        component={MissionPlanningScreen}
        options={{
          tabBarLabel: 'MISSIONS',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-play-outline" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AssetsTab"
        component={AssetSelectionScreen}
        options={{
          tabBarLabel: 'ASSETS',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-industrial" size={size || 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={MissionHistoryScreen}
        options={{
          tabBarLabel: 'LOGS',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-outline" size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="CreateIncident"
        component={CreateIncidentScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="LiveMonitoring"
        component={LiveMonitoringScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DetectionDetails"
        component={DetectionDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};
