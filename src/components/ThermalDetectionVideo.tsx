import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface ThermalDetectionVideoProps {
  compact?: boolean;
  cameraLabel?: string;
  confidence?: number;
  altitude?: number;
  azimuth?: number;
}

export const ThermalDetectionVideo: React.FC<ThermalDetectionVideoProps> = ({
  compact = false,
  cameraLabel = 'FLIR T-800 HD',
  confidence = 94,
  altitude = 120,
  azimuth = 184,
}) => {
  const scanProgress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    const scan = Animated.loop(
      Animated.timing(scanProgress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.78, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    scan.start();
    breathing.start();
    return () => {
      scan.stop();
      breathing.stop();
    };
  }, [pulse, scanProgress]);

  const scanTranslate = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, compact ? 150 : 220],
  });

  return (
    <View style={[styles.frame, compact && styles.frameCompact]}>
      <View style={styles.thermalNoise} />
      <View style={styles.topHud}>
        <View style={styles.recRow}>
          <View style={styles.recDot} />
          <Text style={styles.hudText}>REC · LIVE</Text>
        </View>
        <Text style={styles.hudText}>{cameraLabel}</Text>
      </View>

      <View style={styles.heatScene}>
        <View style={styles.heatHaloLarge} />
        <View style={styles.heatHaloSmall} />
        <Animated.View style={[styles.personSilhouette, { opacity: pulse }]}>
          <View style={styles.personHead} />
          <View style={styles.personBody}>
            <MaterialCommunityIcons name="human" size={compact ? 64 : 92} color="#F8C56A" />
          </View>
        </Animated.View>
        <View style={styles.targetBox}>
          <View style={styles.targetLabel}>
            <MaterialCommunityIcons name="account" size={11} color={Colors.white} />
            <Text style={styles.targetText}>HUMAN {confidence}%</Text>
          </View>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
      </View>

      <Animated.View style={[styles.scanline, { transform: [{ translateY: scanTranslate }] }]} />

      <View style={styles.bottomHud}>
        <Text style={styles.hudText}>ALT: {altitude}M</Text>
        <Text style={styles.hudText}>AZ: {azimuth}°</Text>
        <Text style={styles.hudText}>THERMAL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: '#160F0D',
  },
  frameCompact: {
    height: 190,
  },
  thermalNoise: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
    backgroundColor: '#3A2118',
  },
  topHud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F87171' },
  hudText: { color: '#F9D6A1', fontFamily: 'Courier', fontSize: 9, letterSpacing: 0.6 },
  heatScene: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heatHaloLarge: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(244, 105, 54, 0.22)',
  },
  heatHaloSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 199, 83, 0.2)',
  },
  personSilhouette: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  personHead: {
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: '#FFE08A',
    marginBottom: -7,
    zIndex: 2,
  },
  personBody: { alignItems: 'center', justifyContent: 'center' },
  targetBox: {
    position: 'absolute',
    width: 118,
    height: 156,
    borderWidth: 1,
    borderColor: '#FFD166',
  },
  targetLabel: {
    position: 'absolute',
    top: -23,
    left: -1,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: 'rgba(107, 47, 27, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  targetText: { color: Colors.white, fontFamily: 'Courier', fontSize: 9, fontWeight: '700' },
  cornerTopLeft: { position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FFE08A' },
  cornerTopRight: { position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FFE08A' },
  cornerBottomLeft: { position: 'absolute', bottom: -1, left: -1, width: 14, height: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#FFE08A' },
  cornerBottomRight: { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FFE08A' },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 25,
    height: 2,
    backgroundColor: 'rgba(255, 221, 137, 0.72)',
    shadowColor: '#FFC857',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  bottomHud: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
