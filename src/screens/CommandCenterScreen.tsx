import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalBadge, TacticalMetricCard } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { Incident } from '../types';
import { openScreen } from '../navigation/openScreen';
import type { MainTabScreenProps } from '../types/navigation';

export const CommandCenterScreen: React.FC<MainTabScreenProps<'CommandTab'>> = ({ navigation }) => {
  const { incidents, activeMissionCount, onlineAssetCount, activeAlertCount } = useTactical();

  const handleCreateIncident = () => {
    openScreen(navigation, 'CreateIncident');
  };

  const handleIncidentPress = (_incident: Incident) => {
    openScreen(navigation, 'LiveMap');
  };

  const handleAlertMetricPress = () => {
    openScreen(navigation, 'DetectionDetails');
  };

  const handleAssetsMetricPress = () => {
    openScreen(navigation, 'AssetsTab');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
      case 'low':
      default:
        return Colors.tertiary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="PRESCOUT"
        subtitle="COMMAND & CONTROL"
        onProfilePress={() => openScreen(navigation, 'Profile')}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Title & Connection Status */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Command Center</Text>
          <View style={styles.statusRow}>
            <View style={styles.livePulsePip} />
            <Text style={styles.statusText}>CONNECTED ● MESH ACTIVE</Text>
          </View>
        </View>

        {/* Hero "CREATE INCIDENT" Button */}
        <TouchableOpacity
          style={styles.createIncidentButton}
          onPress={handleCreateIncident}
          activeOpacity={0.85}
        >
          <View style={styles.createIncidentIconWrapper}>
            <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
          </View>
          <Text style={styles.createIncidentText}>CREATE INCIDENT</Text>
        </TouchableOpacity>

        {/* Tactical Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCol}>
            <TacticalMetricCard
              label="Active Missions"
              value={`0${activeMissionCount}`}
              icon="target"
              variant="green"
              onPress={() => openScreen(navigation, 'MissionsTab')}
            />
          </View>
          <View style={styles.metricCol}>
            <TacticalMetricCard
              label="Online Assets"
              value={`0${onlineAssetCount}`}
              subValue="/ 40"
              icon="robot-industrial"
              variant="white"
              onPress={handleAssetsMetricPress}
            />
          </View>
          <View style={styles.metricCol}>
            <TacticalMetricCard
              label="AI Alerts"
              value={`0${activeAlertCount}`}
              icon="brain"
              variant="red"
              onPress={handleAlertMetricPress}
            />
          </View>
          <View style={styles.metricCol}>
            <TacticalMetricCard
              label="Responders"
              value="12"
              icon="account-group"
              variant="white"
            />
          </View>
        </View>

        {/* Active Incidents Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE INCIDENTS</Text>
          <View style={styles.sortPill}>
            <Text style={styles.sortText}>SORT: SEVERITY</Text>
          </View>
        </View>

        {/* Incidents Feed */}
        <View style={styles.incidentsList}>
          {incidents.map((incident) => {
            const borderColor = getPriorityColor(incident.priority);
            return (
              <TouchableOpacity
                key={incident.id}
                style={[styles.incidentCard, { borderLeftColor: borderColor }]}
                onPress={() => handleIncidentPress(incident)}
                activeOpacity={0.8}
              >
                {/* Header Row */}
                <View style={styles.incidentHeaderRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={14}
                        color={Colors.onSurfaceVariant}
                      />
                      <Text style={styles.locationText}>{incident.location}</Text>
                    </View>
                  </View>
                  <TacticalBadge
                    label={incident.priority}
                    variant={incident.priority === 'critical' ? 'critical' : incident.priority === 'high' ? 'high' : 'normal'}
                    size="sm"
                  />
                </View>

                {/* Tactical Meta Box */}
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>RESOURCES</Text>
                    <Text style={styles.metaValue}>{incident.assignedAsset}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>STATUS</Text>
                    <View style={styles.statusPill}>
                      <View style={[styles.metaStatusDot, { backgroundColor: borderColor }]} />
                      <Text style={[styles.metaStatusText, { color: borderColor }]}>
                        {incident.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description Preview */}
                <Text style={styles.incidentDescription} numberOfLines={2}>
                  {incident.description}
                </Text>

                {/* Bottom Quick Action Link */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterAction}>OPEN TACTICAL HUD</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={16}
                    color={Colors.tertiary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  livePulsePip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    letterSpacing: 1.5,
  },
  createIncidentButton: {
    height: 56,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 20,
    shadowColor: Colors.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  createIncidentIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIncidentText: {
    color: Colors.white,
    fontFamily: 'Courier',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCol: {
    width: '48%',
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 1.5,
  },
  sortPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(69, 71, 75, 0.4)',
  },
  sortText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  incidentsList: {
    gap: 14,
  },
  incidentCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(69, 71, 75, 0.35)',
    padding: 16,
  },
  incidentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Courier',
  },
  metaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.white,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaStatusText: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  incidentDescription: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(69, 71, 75, 0.25)',
    paddingTop: 10,
  },
  cardFooterAction: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    letterSpacing: 1,
  },
});
