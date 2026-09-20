import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import type { RootStackScreenProps } from '../types/navigation';

export const SplashScreen: React.FC<RootStackScreenProps<'Splash'>> = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('ESTABLISHING SECURE UPLINK...');
  const progressAnim = useRef(new Animated.Value(0));

  useEffect(() => {
    const messages = [
      'ESTABLISHING SECURE UPLINK...',
      'SYNCING TACTICAL TELEMETRY...',
      'LOADING ASSET TRACKERS...',
      'DECRYPTING COMMAND PROTOCOLS...',
      'GRID DEPLOYMENT READY.',
      'SYSTEM ONLINE.',
    ];

    let handoff: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 4, 100);
        if (next < 25) setStatusMessage(messages[0]);
        else if (next < 50) setStatusMessage(messages[1]);
        else if (next < 75) setStatusMessage(messages[2]);
        else if (next < 95) setStatusMessage(messages[3]);
        else if (next < 100) setStatusMessage(messages[4]);
        else setStatusMessage(messages[5]);

        Animated.timing(progressAnim.current, {
          toValue: next,
          duration: 100,
          useNativeDriver: false,
        }).start();

        if (next >= 100) {
          clearInterval(interval);
          handoff = setTimeout(() => {
            navigation.replace('Onboarding');
          }, 600);
        }
        return next;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      if (handoff) clearTimeout(handoff);
    };
  }, [navigation]);

  const progressWidth = progressAnim.current.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Center Tactical Brand Experience */}
      <View style={styles.centerBox}>
        <View style={styles.radarHalo}>
          <View style={styles.radarRingOuter} />
          <View style={styles.radarRingInner} />
          <View style={styles.droneIconWrapper}>
            <MaterialCommunityIcons name="drone" size={54} color={Colors.tertiary} />
          </View>
        </View>

        <Text style={styles.brandTitle}>RESQMESH</Text>
        <Text style={styles.brandSubtitle}>TACTICAL DISASTER COMMAND SYSTEM</Text>

        <View style={styles.uplinkBadge}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.uplinkText}>MESH NODE ACTIVE: ASIA-PACIFIC-01</Text>
        </View>
      </View>

      {/* Bottom Loading Diagnostics */}
      <View style={styles.bottomBox}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabelText}>INITIALIZING SYSTEMS</Text>
          <Text style={styles.progressPercentText}>{progress}%</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.terminalStatusText}>{statusMessage}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHalo: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 216, 106, 0.25)',
    borderStyle: 'dashed',
  },
  radarRingInner: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1,
    borderColor: 'rgba(184, 216, 106, 0.4)',
  },
  droneIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 4,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Courier',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  uplinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 33, 7, 0.6)',
    borderColor: 'rgba(184, 216, 106, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  uplinkText: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBox: {
    marginBottom: 44,
    width: '100%',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabelText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  progressPercentText: {
    fontSize: 13,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(69, 71, 75, 0.5)',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.tertiary,
    borderRadius: 2,
  },
  terminalStatusText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.tertiary,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.9,
  },
});
