import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalButton } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { openScreen } from '../navigation/openScreen';
import { ThermalDetectionVideo } from '../components/ThermalDetectionVideo';
import type { RootStackScreenProps } from '../types/navigation';

function parseDetectionCoordinates(value?: string) {
  if (!value) return undefined;
  const match = value.match(
    /^\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([NS])\s*,\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([EW])\s*$/i
  );
  if (!match) return undefined;

  const latitude = Number(match[1]) * (match[2].toUpperCase() === 'S' ? -1 : 1);
  const longitude = Number(match[3]) * (match[4].toUpperCase() === 'W' ? -1 : 1);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

export const DetectionDetailsScreen: React.FC<RootStackScreenProps<'DetectionDetails'>> = ({
  navigation,
  route,
}) => {
  const { alerts, resolveAlert, appendLog } = useTactical();
  const { alertId } = route.params ?? {};
  const alertItem = alerts.find((alert) => alert.id === alertId) || alerts[0];
  const [isResolved, setIsResolved] = useState(alertItem?.status === 'RESOLVED');
  const [copied, setCopied] = useState(false);
  const copiedRef = useRef(false);
  const detectionCoordinate = parseDetectionCoordinates(alertItem?.coordinates);

  const handleResolve = () => {
    if (alertItem) {
      resolveAlert(alertItem.id);
      setIsResolved(true);
      Alert.alert('Alert Resolved', 'Detection marked as verified and resolved by command operator.');
    }
  };

  // Store timer ref for cleanup to prevent state updates after unmount
  useEffect(() => {
    return () => {
      copiedRef.current = false;
    };
  }, []);

  const handleCopyCoords = async () => {
    const coordinates = alertItem?.coordinates || '18.5204° N, 73.8567° E';
    try {
      await Clipboard.setStringAsync(coordinates);
      appendLog('SYS', `Coordinates copied for ${alertItem?.title || 'active detection'}.`);
      setCopied(true);
      copiedRef.current = true;
      setTimeout(() => {
        if (copiedRef.current) {
          setCopied(false);
        }
      }, 2000);
    } catch (error) {
      appendLog('SYS', `Failed to copy coordinates: ${error instanceof Error ? error.message : String(error)}`, 'warning');
      setCopied(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="RESQMESH"
        subtitle="FORENSIC SENSOR INTELLIGENCE"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Incident Sub-Header */}
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>Detection Details</Text>
          <Text style={styles.subHeaderId}>INCIDENT-ID: #883-ALPHA</Text>
        </View>

        {/* Forensic Thermal Screen Frame */}
        <View style={styles.thermalFrame}>
          <ThermalDetectionVideo
            compact
            cameraLabel={alertItem?.flirCameraModel || 'FLIR T-800 HD'}
            confidence={alertItem?.confidence || 94}
            altitude={alertItem?.altitude || 450}
            azimuth={alertItem?.azimuth || 184}
          />
          {/* Top HUD */}
          <View style={styles.thermalTopHud}>
            <View style={styles.recDotRow}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC ⚬ LIVE</Text>
            </View>
            <Text style={styles.cameraModelText}>{alertItem?.flirCameraModel || 'FLIR T-800'}</Text>
          </View>

          {/* Central Target Bounding Box */}
          <View style={styles.targetContainer}>
            <View style={styles.targetTag}>
              <MaterialCommunityIcons name="account" size={10} color={Colors.white} />
              <Text style={styles.targetTagText}>PERSON 94%</Text>
            </View>
            <View style={styles.targetReticleCorners} />
          </View>

          {/* Bottom HUD */}
          <View style={styles.thermalBottomHud}>
            <Text style={styles.telemetryTag}>ALT: {alertItem?.altitude || 450}M</Text>
            <Text style={styles.telemetryTag}>AZ: {alertItem?.azimuth || 184}°</Text>
          </View>

          {/* Scanline Overlay */}
          <View style={styles.scanlineLaser} />
        </View>

        {/* Alert Metadata Card */}
        <View style={styles.alertCard}>
          {/* Card Banner */}
          <View style={[styles.alertBanner, isResolved && { backgroundColor: Colors.tertiaryContainer }]}>
            <MaterialCommunityIcons
              name={isResolved ? 'check-circle' : 'alert'}
              size={20}
              color={isResolved ? Colors.tertiary : Colors.error}
            />
            <View>
              <Text style={[styles.alertBannerTitle, isResolved && { color: Colors.tertiary }]}>
                {isResolved ? 'THREAT RESOLVED' : alertItem?.title || 'PERSON DETECTED'}
              </Text>
              <Text style={styles.alertBannerSub}>
                Severity: {alertItem?.severity || 'Critical'} ● Status: {isResolved ? 'RESOLVED' : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Details Rows */}
          <View style={styles.cardBody}>
            <View style={styles.metaRowTwoCol}>
              <View style={styles.metaCol}>
                <Text style={styles.metaFieldLabel}>Confidence</Text>
                <Text style={styles.metaFieldValueGreen}>{alertItem?.confidence || 94}%</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaFieldLabel}>Time (UTC)</Text>
                <Text style={styles.metaFieldValueWhite}>{alertItem?.timestamp || '20:24:18'}</Text>
              </View>
            </View>

            <View style={styles.metaRowSingle}>
              <Text style={styles.metaFieldLabel}>Source Feed</Text>
              <View style={styles.feedRow}>
                <MaterialCommunityIcons name="drone" size={16} color={Colors.primary} />
                <Text style={styles.feedText}>{alertItem?.sourceFeed || 'Drone-01 (Thermal FLIR)'}</Text>
              </View>
            </View>

            <View style={styles.metaRowSingle}>
              <Text style={styles.metaFieldLabel}>Location Coordinates</Text>
              <TouchableOpacity
                style={styles.coordsBox}
                onPress={handleCopyCoords}
                activeOpacity={0.7}
              >
                <Text style={styles.coordsText}>
                  {alertItem?.coordinates || '18.5204° N, 73.8567° E'}
                </Text>
                <MaterialCommunityIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={16}
                  color={copied ? Colors.tertiary : Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionSection}>
          <TacticalButton
            label="VIEW ON MAP"
            variant="primary"
            icon="map-marker-radius"
            onPress={() =>
              openScreen(navigation, 'LiveMap', {
                focusDetection: {
                  id: alertItem?.id || 'FOCUSED-PERSON',
                  latitude: detectionCoordinate?.latitude ?? 18.5204,
                  longitude: detectionCoordinate?.longitude ?? 73.8567,
                },
              })
            }
          />

          <View style={styles.twoColButtons}>
            <View style={{ flex: 1 }}>
              <TacticalButton
                label="SAVE EVIDENCE"
                variant="secondary"
                icon="content-save-outline"
                onPress={() => {
                  appendLog('SYS', 'Thermal imagery and telemetry saved to the evidence vault.');
                  Alert.alert('Saved', 'Thermal imagery and telemetry logged to evidence vault.');
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TacticalButton
                label="SHARE TEAM"
                variant="secondary"
                icon="share-variant-outline"
                onPress={() => {
                  appendLog('COMM', 'Detection telemetry shared with the tactical mesh network.');
                  Alert.alert('Shared', 'Telemetry beacon broadcasted to tactical mesh network.');
                }}
              />
            </View>
          </View>

          {!isResolved ? (
            <TacticalButton
              label="MARK RESOLVED"
              variant="blue"
              icon="check-circle-outline"
              onPress={handleResolve}
            />
          ) : (
            <View style={styles.resolvedPill}>
              <MaterialCommunityIcons name="check" size={16} color={Colors.tertiary} />
              <Text style={styles.resolvedPillText}>MARKED AS RESOLVED</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  subHeader: {
    marginBottom: 4,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  subHeaderId: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 2,
  },
  thermalFrame: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.surfaceDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 12,
  },
  thermalTopHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  recDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  recText: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.error,
  },
  cameraModelText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
  },
  targetContainer: {
    position: 'absolute',
    top: '32%',
    left: '35%',
    width: 100,
    height: 110,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTag: {
    position: 'absolute',
    top: -18,
    left: -2,
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  targetTagText: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontWeight: '800',
    color: Colors.white,
  },
  targetReticleCorners: {
    width: 14,
    height: 14,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: Colors.error,
  },
  thermalBottomHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  telemetryTag: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scanlineLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  alertBanner: {
    backgroundColor: Colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  alertBannerSub: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
    gap: 14,
  },
  metaRowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaFieldLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaFieldValueGreen: {
    fontSize: 22,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
  },
  metaFieldValueWhite: {
    fontSize: 18,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
  },
  metaRowSingle: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(203, 213, 225, 0.25)',
    paddingTop: 10,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  feedText: {
    fontSize: 13,
    color: Colors.white,
  },
  coordsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.4)',
    marginTop: 4,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: Colors.white,
    fontWeight: '700',
  },
  actionSection: {
    gap: 10,
  },
  twoColButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  resolvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  resolvedPillText: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    letterSpacing: 1,
  },
});
