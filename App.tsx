import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { TacticalProvider } from './src/context/TacticalContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme/colors';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    let active = true;

    const requestLocationAccess = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (active && !permission.granted) {
        Alert.alert(
          'Location access needed',
          'ResQMesh uses your location so incident reports include the exact place where help is needed.',
          [
            { text: 'Try again', onPress: requestLocationAccess },
            { text: 'Not now', style: 'cancel' },
          ]
        );
      }
    };

    void requestLocationAccess();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
        <TacticalProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: Colors.tertiary,
                background: Colors.background,
                card: Colors.surfaceContainer,
                text: Colors.white,
                border: Colors.outlineVariant,
                notification: Colors.error,
              },
              fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '900' },
              },
            }}
          >
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </TacticalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
