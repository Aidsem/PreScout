import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, CrosshairReticle } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { openScreen } from '../navigation/openScreen';
import { ThermalDetectionVideo } from '../components/ThermalDetectionVideo';

const { width } = Dimensions.get('window');

export const LiveMonitoringScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { telemetry, toggleCameraMode, logs, alerts, appendLog } = useTactical();
  const [escalated, setEscalated] = useState(false);

  const isThermal = telemetry.cameraMode === 'THERMAL';
  const activeAlert = alerts[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="RESQMESH"
        subtitle="SURVEILLANCE & AI SENSORS"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.escalateBtn, escalated && styles.escalateBtnActive]}
            onPress={() => {
              const nextEscalated = !escalated;
              setEscalated(nextEscalated);
              appendLog(
                'SYS',
                nextEscalated ? 'Mission escalated to command operator.' : 'Mission escalation cleared.',
                nextEscalated ? 'warning' : 'info'
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="alert-decagram" size={16} color={Colors.white} />
            <Text style={styles.escalateText}>{escalated ? 'ESCALATED' : 'ESCALATE'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission Identification Bar */}
        <View style={styles.headerInfoRow}>
          <View>
            <View style={styles.liveBroadcastRow}>
              <View style={styles.broadcastRedDot} />
              <Text style={styles.broadcastLabel}>LIVE BROADCAST</Text>
            </View>
            <Text style={styles.missionHeadline}>MISSION LIVE</Text>
            <Text style={styles.missionSub}>Flood Rescue #024 - Sector 7 Delta</Text>
          </View>
        </View>

        {/* Video Viewport Stage */}
        <View style={[styles.videoViewport, isThermal ? styles.viewportThermal : styles.viewportRGB]}>
          {isThermal && (
            <ThermalDetectionVideo
              cameraLabel={activeAlert?.flirCameraModel || 'FLIR T-800 HD'}
              confidence={activeAlert?.confidence || 94}
              altitude={activeAlert?.altitude || telemetry.altitude}
              azimuth={activeAlert?.azimuth || 184}
            />
          )}
          {/* Top Camera Controls HUD */}
          <View style={styles.videoTopBar}>
            <View style={styles.videoFeedBadge}>
              <MaterialCommunityIcons name="video" size={14} color={Colors.tertiary} />
              <Text style={styles.videoFeedBadgeText}>DRONE-01 LIVE</Text>
            </View>

            {/* Mode Switcher: RGB / THERMAL */}
            <View style={styles.modeToggleGroup}>
              <TouchableOpacity
                style={[styles.modeToggleBtn, !isThermal && styles.modeToggleBtnActive]}
                onPress={() => isThermal && toggleCameraMode()}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeToggleText, !isThermal && styles.modeToggleTextActive]}>
                  RGB
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeToggleBtn, isThermal && styles.modeToggleBtnActive]}
                onPress={() => !isThermal && toggleCameraMode()}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeToggleText, isThermal && styles.modeToggleTextActive]}>
                  THERMAL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Central Crosshair Reticle */}
          <View style={styles.reticleWrapper}>
            <CrosshairReticle size={140} />
            {/* Target Box Overlay Simulation */}
            <View style={styles.targetBoundingBox}>
              <View style={styles.targetLabelTag}>
                <Text style={styles.targetLabelText}>HUMAN 94%</Text>
              </View>
            </View>
          </View>

          {/* Thermal / RGB Atmosphere Grid */}
          <View style={styles.videoHudWatermark}>
            <Text style={styles.watermarkText}>FLIR T-800 HD</Text>
            <Text style={styles.watermarkText}>FPS: 60 | LATENCY: 28ms</Text>
          </View>

          {/* Bottom Telemetry Overlay Bar */}
          <View style={styles.telemetryOverlayBar}>
            <View style={styles.telemetryCell}>
              <Text style={styles.telemetryCellLabel}>ALTITUDE</Text>
              <Text style={styles.telemetryCellVal}>{telemetry.altitude}m</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryCell}>
              <Text style={styles.telemetryCellLabel}>SPEED</Text>
              <Text style={styles.telemetryCellVal}>{telemetry.speed}m/s</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryCell}>
              <Text style={styles.telemetryCellLabel}>BATTERY</Text>
              <Text style={styles.telemetryCellVal}>{telemetry.battery}%</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryCell}>
              <Text style={styles.telemetryCellLabel}>LINK</Text>
              <Text style={styles.telemetryCellVal}>{telemetry.signal}</Text>
            </View>
          </View>
        </View>

        {/* AI Detection Card */}
        {activeAlert && (
          <View style={styles.detectionAlertCard}>
            <View style={styles.alertHeaderRow}>
              <View style={styles.alertIconCircle}>
                <MaterialCommunityIcons name="alert" size={20} color={Colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitleText}>{activeAlert.title}</Text>
                <View style={styles.confidenceBarWrapper}>
                  <View style={styles.confidenceBarTrack}>
                    <View style={[styles.confidenceBarFill, { width: `${activeAlert.confidence}%` }]} />
                  </View>
                  <Text style={styles.confidencePercentText}>{activeAlert.confidence}% CONF</Text>
                </View>
              </View>
            </View>

            {/* GPS & Timestamp Grid */}
            <View style={styles.alertDataGrid}>
              <View style={styles.alertDataBox}>
                <Text style={styles.alertDataLabel}>COORDINATES</Text>
                <Text style={styles.alertDataValue}>{activeAlert.coordinates}</Text>
              </View>
              <View style={styles.alertDataBox}>
                <Text style={styles.alertDataLabel}>TIMESTAMP</Text>
                <Text style={styles.alertDataValue}>{activeAlert.timestamp}</Text>
              </View>
            </View>

            {/* Card Actions */}
            <View style={styles.alertActionButtons}>
              <TouchableOpacity
                style={styles.viewOnMapButton}
                onPress={() => {
                  const match = activeAlert?.coordinates.match(
                    /^\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([NS])\s*,\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([EW])\s*$/i
                  );
                  const latitude = match
                    ? Number(match[1]) * (match[2].toUpperCase() === 'S' ? -1 : 1)
                    : 18.5204;
                  const longitude = match
                    ? Number(match[3]) * (match[4].toUpperCase() === 'W' ? -1 : 1)
                    : 73.8567;
                  openScreen(navigation, 'LiveMap', {
                    focusDetection: {
                      id: activeAlert?.id || 'ACTIVE-DETECTION',
                      latitude,
                      longitude,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="map-marker" size={16} color={Colors.white} />
                <Text style={styles.viewOnMapText}>VIEW ON MAP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => openScreen(navigation, 'DetectionDetails', { alertId: activeAlert?.id })}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="file-document-outline" size={16} color={Colors.white} />
                <Text style={styles.detailsButtonText}>FORENSIC INTEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* System Logs Stream */}
        <View style={styles.logsCard}>
          <View style={styles.logsHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="text-box-multiple" size={16} color={Colors.primary} />
              <Text style={styles.logsTitle}>SYSTEM TELEMETRY LOGS</Text>
            </View>
            <View style={styles.liveLogTag}>
              <Text style={styles.liveLogTagText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.logsList}>
            {logs.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.logRow}>
                <Text style={styles.logTimestamp}>{item.time}</Text>
                <View style={[styles.logCategoryPill, item.level === 'alert' && { borderColor: Colors.error }]}>
                  <Text style={[styles.logCategoryText, item.level === 'alert' && { color: Colors.error }]}>
                    {item.category}
                  </Text>
                </View>
                <Text style={styles.logMessage} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
            ))}
          </View>
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
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  escalateBtnActive: {
    backgroundColor: Colors.error,
  },
  escalateText: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerInfoRow: {
    marginBottom: 4,
  },
  liveBroadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  broadcastRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  broadcastLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 1,
  },
  missionHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  missionSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  videoViewport: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  viewportRGB: {
    backgroundColor: '#0c1626',
  },
  viewportThermal: {
    backgroundColor: '#1b0d26',
  },
  videoTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 10,
    backgroundColor: 'rgba(10, 15, 26, 0.4)',
  },
  videoFeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 26, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.1)',
  },
  videoFeedBadgeText: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 15, 26, 0.7)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.15)',
    padding: 2,
  },
  modeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.surfaceVariant,
  },
  modeToggleText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  modeToggleTextActive: {
    color: Colors.white,
  },
  reticleWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBoundingBox: {
    position: 'absolute',
    top: '36%',
    left: '38%',
    width: 68,
    height: 76,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  targetLabelTag: {
    position: 'absolute',
    top: -16,
    left: -2,
    backgroundColor: Colors.error,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  targetLabelText: {
    fontSize: 7,
    fontFamily: 'Courier',
    fontWeight: '800',
    color: Colors.white,
  },
  videoHudWatermark: {
    position: 'absolute',
    right: 12,
    bottom: 64,
    alignItems: 'flex-end',
  },
  watermarkText: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
  telemetryOverlayBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 15, 26, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(203, 213, 225, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryCell: {
    alignItems: 'center',
    flex: 1,
  },
  telemetryCellLabel: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  telemetryCellVal: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    marginTop: 1,
  },
  telemetryDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  detectionAlertCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confidenceBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: Colors.error,
  },
  confidencePercentText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  alertDataGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  alertDataBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 8,
  },
  alertDataLabel: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  alertDataValue: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.white,
    fontWeight: '700',
  },
  alertActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewOnMapButton: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewOnMapText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  detailsButton: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  logsCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
  },
  logsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.3)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  logsTitle: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 1,
  },
  liveLogTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveLogTagText: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
  },
  logsList: {
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logTimestamp: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    width: 38,
  },
  logCategoryPill: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(69, 71, 75, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  logCategoryText: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
  },
  logMessage: {
    flex: 1,
    fontSize: 11,
    color: Colors.onSurface,
    lineHeight: 16,
  },
});
