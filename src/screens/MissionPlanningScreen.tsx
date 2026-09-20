import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalButton } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { openScreen } from '../navigation/openScreen';
import type { MainTabScreenProps } from '../types/navigation';

export const MissionPlanningScreen: React.FC<MainTabScreenProps<'MissionsTab'>> = ({ navigation }) => {
  const { missionParams, assets, updateMissionParams, startFlightSimulation } = useTactical();

  const [geofence, setGeofence] = useState(missionParams.geofenceEnabled);
  const [selectedProfile, setSelectedProfile] = useState(missionParams.aiProfile);
  const [area, setArea] = useState(missionParams.areaKm2);
  const [altitude, setAltitude] = useState(missionParams.altitude);
  const [speed, setSpeed] = useState(missionParams.speed);
  const [selectedDroneId, setSelectedDroneId] = useState(missionParams.droneUnitId);
  const [selectedRoverId, setSelectedRoverId] = useState(missionParams.roverUnitId);
  const drones = assets.filter((asset) => asset.type === 'drone' && asset.status === 'AVAILABLE');
  const rovers = assets.filter((asset) => asset.type === 'rover' && asset.status === 'AVAILABLE');

  const aiProfiles: ('Person + Hazard' | 'Thermal Signatures' | 'Structural Damage')[] = [
    'Person + Hazard',
    'Thermal Signatures',
    'Structural Damage',
  ];

  const handleUpload = () => {
    const params = {
      geofenceEnabled: geofence,
      aiProfile: selectedProfile,
      areaKm2: area,
      altitude,
      speed,
      unitId: selectedDroneId,
      droneUnitId: selectedDroneId,
      roverUnitId: selectedRoverId,
    };
    updateMissionParams(params);
    Alert.alert(
      'Mission Uploaded',
      'Flight waypoints & AI detection profiles transmitted to DRONE-01 via mesh telemetry.',
      [
        {
          text: 'Monitor Mission',
          onPress: () =>
            openScreen(navigation, 'LiveMap', {
              missionAssignment: {
                droneUnitId: selectedDroneId,
                roverUnitId: selectedRoverId,
              },
            }),
        },
      ]
    );
  };

  const handleSimulate = () => {
    updateMissionParams({
      geofenceEnabled: geofence,
      aiProfile: selectedProfile,
      areaKm2: area,
      altitude,
      speed,
      unitId: selectedDroneId,
      droneUnitId: selectedDroneId,
      roverUnitId: selectedRoverId,
    });
    startFlightSimulation();
    openScreen(navigation, 'LiveMap');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="PRESCOUT"
        subtitle="MISSION PLANNING & GEOFENCING"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Progress Visual */}
        <View style={styles.stepProgressBlock}>
          <View style={styles.stepLabelsRow}>
            <Text style={styles.stepLabelActive}>1. AREA</Text>
            <Text style={styles.stepLabelActive}>2. WAYPOINTS</Text>
            <Text style={[styles.stepLabelActive, { color: Colors.white }]}>3. AI CONFIG</Text>
            <Text style={styles.stepLabelPending}>4. UPLOAD</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <View style={styles.assignmentBars}>
          <View style={styles.assignedUnitCard}>
            <View style={styles.assignmentSection}>
            <View style={styles.assignmentHeading}>
              <MaterialCommunityIcons name="drone" size={20} color={Colors.tertiary} />
              <Text style={styles.unitLabel}>ASSIGN DRONE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitChoices}>
              {drones.map((asset) => {
                const selected = selectedDroneId === asset.id;
                return (
                  <TouchableOpacity key={asset.id} style={[styles.unitChoice, selected && styles.unitChoiceSelected]} onPress={() => setSelectedDroneId(asset.id)}>
                    <Text style={[styles.unitChoiceName, selected && styles.unitChoiceNameSelected]}>{asset.name}</Text>
                    <Text style={styles.unitChoiceStation}>{asset.stationName.replace(' Fire Brigade', '')}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          </View>
          <View style={[styles.assignedUnitCard, styles.roverAssignmentCard]}>
            <View style={styles.assignmentSection}>
            <View style={styles.assignmentHeading}>
              <MaterialCommunityIcons name="robot-industrial" size={20} color={Colors.primary} />
              <Text style={styles.unitLabel}>ASSIGN ROVER</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitChoices}>
              {rovers.map((asset) => {
                const selected = selectedRoverId === asset.id;
                return (
                  <TouchableOpacity key={asset.id} style={[styles.unitChoice, selected && styles.unitChoiceSelected]} onPress={() => setSelectedRoverId(asset.id)}>
                    <Text style={[styles.unitChoiceName, selected && styles.unitChoiceNameSelected]}>{asset.name}</Text>
                    <Text style={styles.unitChoiceStation}>{asset.stationName.replace(' Police Station', '')}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          </View>
        </View>

        {/* Tactical Parameters 2x2 Grid */}
        <View style={styles.paramGrid}>
          <View style={styles.paramCell}>
            <Text style={styles.paramLabel}>OPERATION TYPE</Text>
            <Text style={styles.paramValue}>SAR</Text>
          </View>
          <View style={styles.paramCell}>
            <Text style={styles.paramLabel}>SEARCH AREA</Text>
            <Text style={styles.paramValueMono}>{area} km²</Text>
          </View>
          <View style={styles.paramCell}>
            <Text style={styles.paramLabel}>FLIGHT ALTITUDE</Text>
            <Text style={styles.paramValueMono}>{altitude}m</Text>
          </View>
          <View style={styles.paramCell}>
            <Text style={styles.paramLabel}>SWEEP SPEED</Text>
            <Text style={styles.paramValueMono}>{speed}m/s</Text>
          </View>
        </View>

        {/* Parameter Fine-Tuning Controls */}
        <View style={styles.sliderSection}>
          <Text style={styles.sectionHeader}>TUNING PARAMETERS</Text>

          <View style={styles.adjustRow}>
            <Text style={styles.adjustLabel}>Altitude Target</Text>
            <View style={styles.adjustButtons}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setAltitude(Math.max(50, altitude - 10))}
              >
                <Text style={styles.adjustBtnText}>-10m</Text>
              </TouchableOpacity>
              <Text style={styles.adjustCurrentVal}>{altitude}m</Text>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setAltitude(altitude + 10)}
              >
                <Text style={styles.adjustBtnText}>+10m</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.adjustRow}>
            <Text style={styles.adjustLabel}>Search Area</Text>
            <View style={styles.adjustButtons}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setArea(Math.max(0.5, Math.round((area - 0.5) * 10) / 10))}
              >
                <Text style={styles.adjustBtnText}>-0.5</Text>
              </TouchableOpacity>
              <Text style={styles.adjustCurrentVal}>{area} km²</Text>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => setArea(Math.round((area + 0.5) * 10) / 10)}
              >
                <Text style={styles.adjustBtnText}>+0.5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Geofence Switch */}
        <View style={styles.geofenceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.geofenceTitle}>Tactical Geofence</Text>
            <Text style={styles.geofenceSubtitle}>
              Hard perimeter lock to prevent unit drift outside sector boundaries
            </Text>
          </View>
          <Switch
            value={geofence}
            onValueChange={setGeofence}
            trackColor={{ false: Colors.surfaceVariant, true: Colors.tertiary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* AI Detection Profile Selector */}
        <View style={styles.aiProfileSection}>
          <Text style={styles.sectionHeader}>ONBOARD AI DETECTION PROFILE</Text>
          <View style={styles.profileList}>
            {aiProfiles.map((p) => {
              const isSelected = selectedProfile === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.profileButton, isSelected && styles.profileButtonSelected]}
                  onPress={() => setSelectedProfile(p)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={
                      p === 'Person + Hazard'
                        ? 'account-eye'
                        : p === 'Thermal Signatures'
                        ? 'weather-sunny'
                        : 'home-alert'
                    }
                    size={20}
                    color={isSelected ? Colors.tertiary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.profileText, isSelected && styles.profileTextSelected]}>
                    {p}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={Colors.tertiary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Triggers */}
        <View style={styles.actionsBox}>
          <TacticalButton
            label="UPLOAD TO FLEET"
            variant="blue"
            icon="cloud-upload"
            onPress={handleUpload}
          />
          <TacticalButton
            label="SIMULATE FLIGHT PATH"
            variant="secondary"
            icon="play"
            onPress={handleSimulate}
          />
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
  stepProgressBlock: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepLabelActive: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    letterSpacing: 0.5,
  },
  stepLabelPending: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: Colors.tertiary,
    borderRadius: 2,
  },
  assignedUnitCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignmentBars: {
    gap: 10,
  },
  roverAssignmentCard: {
    borderColor: Colors.primary,
  },
  unitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitLabel: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  unitName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 2,
  },
  assignmentSection: { gap: 8 },
  assignmentHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitChoices: { gap: 8, paddingVertical: 2 },
  unitChoice: {
    minWidth: 100,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  unitChoiceSelected: { borderColor: Colors.tertiary, backgroundColor: 'rgba(184, 216, 106, 0.1)' },
  unitChoiceName: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  unitChoiceNameSelected: { color: Colors.tertiary },
  unitChoiceStation: { color: Colors.onSurfaceVariant, fontSize: 8, marginTop: 3 },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paramCell: {
    width: '48%',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 12,
  },
  paramLabel: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  paramValueMono: {
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
  },
  sliderSection: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adjustLabel: {
    fontSize: 12,
    color: Colors.white,
  },
  adjustButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjustBtn: {
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adjustBtnText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.onSurface,
    fontWeight: '700',
  },
  adjustCurrentVal: {
    fontSize: 13,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.tertiary,
    minWidth: 50,
    textAlign: 'center',
  },
  geofenceCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  geofenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  geofenceSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  aiProfileSection: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: 10,
  },
  profileList: {
    gap: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 12,
  },
  profileButtonSelected: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(184, 216, 106, 0.1)',
  },
  profileText: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  profileTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  actionsBox: {
    gap: 10,
    marginTop: 4,
  },
});
