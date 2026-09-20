import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalBadge } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { FleetAsset } from '../types';
import type { MainTabScreenProps } from '../types/navigation';

export const AssetSelectionScreen: React.FC<MainTabScreenProps<'AssetsTab'>> = ({ navigation }) => {
  const { assets, incidents, assignAsset, unassignAsset } = useTactical();
  const [filter, setFilter] = useState<'all' | 'drones' | 'rovers' | 'available'>('all');
  const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED');
  const [targetIncidentId, setTargetIncidentId] = useState<string | undefined>(activeIncidents[0]?.id);
  useEffect(() => {
    if (!activeIncidents.some((incident) => incident.id === targetIncidentId)) {
      setTargetIncidentId(activeIncidents[0]?.id);
    }
  }, [activeIncidents, targetIncidentId]);
  const targetIncident = activeIncidents.find((incident) => incident.id === targetIncidentId);

  const handleAssign = (asset: FleetAsset) => {
    if (asset.status === 'ON MISSION') {
      const result = unassignAsset(asset.id);
      if (!result.ok) Alert.alert('Cannot release unit', result.reason);
      return;
    }
    if (!targetIncident) {
      Alert.alert('No active incident', 'Create or select an incident before assigning units.');
      return;
    }
    const result = assignAsset(asset.id, targetIncident.id);
    if (!result.ok) Alert.alert('Cannot assign unit', result.reason);
  };

  const filteredAssets = assets.filter((asset) => {
    if (filter === 'drones') return asset.type === 'drone';
    if (filter === 'rovers') return asset.type === 'rover';
    if (filter === 'available') return asset.status === 'AVAILABLE';
    return true;
  });
  const droneCount = assets.filter((asset) => asset.type === 'drone').length;
  const roverCount = assets.filter((asset) => asset.type === 'rover').length;

  const getStatusBadge = (status: FleetAsset['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <TacticalBadge label="AVAILABLE" variant="available" icon="check-circle" size="sm" />;
      case 'ON MISSION':
        return <TacticalBadge label="ON MISSION" variant="mission" icon="alert-circle-outline" size="sm" />;
      case 'CHARGING':
        return <TacticalBadge label="CHARGING" variant="charging" icon="lightning-bolt" size="sm" />;
      default:
        return <TacticalBadge label="STANDBY" variant="info" size="sm" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="PRESCOUT"
        subtitle="FLEET INVENTORY & DISPATCH"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Select Response Asset</Text>
          <Text style={styles.pageSubtitle}>
            {droneCount} drones · {roverCount} rovers · {assets.length} total units
          </Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'drones' && styles.filterChipActive]}
            onPress={() => setFilter('drones')}
          >
            <Text style={[styles.filterChipText, filter === 'drones' && styles.filterChipTextActive]}>
              Drones ({droneCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'rovers' && styles.filterChipActive]}
            onPress={() => setFilter('rovers')}
          >
            <Text style={[styles.filterChipText, filter === 'rovers' && styles.filterChipTextActive]}>
              Ground Robots ({roverCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'available' && styles.filterChipActive]}
            onPress={() => setFilter('available')}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={12}
              color={filter === 'available' ? Colors.primaryContainer : Colors.tertiary}
            />
            <Text style={[styles.filterChipText, filter === 'available' && styles.filterChipTextActive]}>
              Available
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Assignment Target */}
        <View style={styles.targetSection}>
          <Text style={styles.targetLabel}>ASSIGN TO INCIDENT</Text>
          {activeIncidents.length === 0 ? (
            <Text style={styles.targetEmpty}>No active incidents — create one to assign units.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {activeIncidents.map((incident) => {
                const selected = incident.id === targetIncidentId;
                return (
                  <TouchableOpacity
                    key={incident.id}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => setTargetIncidentId(incident.id)}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {incident.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.inventorySummary}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color={Colors.tertiary} />
          <Text style={styles.inventorySummaryText}>
            Showing {filteredAssets.length} units positioned across Pune response centers
          </Text>
        </View>

        {/* Asset Cards Grid */}
        <View style={styles.assetsList}>
          {filteredAssets.map((asset) => {
            const isAssigned = asset.status === 'ON MISSION';
            const isCharging = asset.status === 'CHARGING';

            return (
              <View key={asset.id} style={styles.assetCard}>
                {/* Background Watermark Icon */}
                <View style={styles.watermarkIcon}>
                  <MaterialCommunityIcons
                    name={asset.type === 'drone' ? 'drone' : 'robot-industrial'}
                    size={72}
                    color="rgba(255, 255, 255, 0.04)"
                  />
                </View>

                {/* Header */}
                <View style={styles.assetHeader}>
                  <View>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetSubType}>{asset.subType}</Text>
                    <Text style={styles.stationName}>
                      {asset.type === 'drone' ? 'Fire brigade' : 'Police station'} · {asset.stationName}
                    </Text>
                  </View>
                  {getStatusBadge(asset.status)}
                </View>

                {/* Telemetry Cells */}
                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryLabel}>Battery</Text>
                    <Text
                      style={[
                        styles.telemetryValue,
                        { color: asset.battery > 50 ? Colors.tertiary : Colors.error },
                      ]}
                    >
                      {asset.battery}%
                    </Text>
                  </View>

                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryLabel}>
                      {asset.eta ? 'Deployment ETA' : 'Signal Link'}
                    </Text>
                    <Text style={styles.telemetryValue}>
                      {asset.eta || asset.signal}
                    </Text>
                  </View>

                  <View style={[styles.telemetryCell, { width: '100%' }]}>
                    <Text style={styles.telemetryLabel}>Sensor & Payload</Text>
                    <Text style={styles.payloadText}>{asset.payload}</Text>
                  </View>
                </View>

                {/* Action Trigger */}
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    isAssigned
                      ? styles.assignedButton
                      : isCharging
                      ? styles.chargingButton
                      : styles.availableButton,
                    isCharging && styles.disabledButton,
                  ]}
                  onPress={() => handleAssign(asset)}
                  disabled={isCharging}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={
                      isAssigned
                        ? 'close-circle-outline'
                        : isCharging
                        ? 'lightning-bolt'
                        : 'check-circle-outline'
                    }
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.assignButtonText}>
                    {isAssigned
                      ? 'RELEASE FROM MISSION'
                      : isCharging
                      ? 'CHARGING UNIT'
                      : targetIncident
                      ? `ASSIGN TO ${targetIncident.title.toUpperCase()}`
                      : 'NO ACTIVE INCIDENT'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  scrollArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  titleSection: {
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurface,
  },
  filterChipTextActive: {
    color: Colors.primaryContainer,
  },
  targetSection: {
    gap: 8,
  },
  targetLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
  },
  targetEmpty: {
    fontSize: 11,
    color: Colors.outline,
  },
  inventorySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 2,
  },
  inventorySummaryText: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  assetsList: {
    gap: 14,
  },
  assetCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    zIndex: 1,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  assetSubType: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  stationName: {
    fontSize: 10,
    color: Colors.tertiary,
    marginTop: 5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    zIndex: 1,
  },
  telemetryCell: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(69, 71, 75, 0.3)',
    padding: 10,
  },
  telemetryLabel: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  telemetryValue: {
    fontSize: 14,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
  },
  payloadText: {
    fontSize: 12,
    color: Colors.white,
    marginTop: 1,
  },
  assignButton: {
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  availableButton: {
    backgroundColor: Colors.accentBlue,
  },
  assignedButton: {
    backgroundColor: Colors.secondaryContainer,
  },
  chargingButton: {
    backgroundColor: Colors.surfaceVariant,
  },
  disabledButton: {
    opacity: 0.55,
  },
  assignButtonText: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
