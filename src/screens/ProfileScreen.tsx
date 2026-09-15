import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalBadge } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { assets, activeMissionCount, activeAlertCount } = useTactical();
  const drones = assets.filter((asset) => asset.type === 'drone');
  const rovers = assets.filter((asset) => asset.type === 'rover');
  const available = assets.filter((asset) => asset.status === 'AVAILABLE').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="RESQMESH"
        subtitle="OPERATOR PROFILE"
        showBack
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account-tie-outline" size={34} color={Colors.primaryContainer} />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>Command operator</Text>
            <Text style={styles.role}>Pune emergency response mesh</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ON DUTY · MESH CONNECTED</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Operational overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{drones.length}</Text>
            <Text style={styles.statLabel}>Drones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rovers.length}</Text>
            <Text style={styles.statLabel}>Ground robots</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{available}</Text>
            <Text style={styles.statLabel}>Available now</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeMissionCount}</Text>
            <Text style={styles.statLabel}>Active missions</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Access and system status</Text>
        <View style={styles.listCard}>
          <View style={styles.listRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={Colors.tertiary} />
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>Operator access</Text>
              <Text style={styles.listSubtitle}>Full dispatch and incident control</Text>
            </View>
            <TacticalBadge label="VERIFIED" variant="available" size="sm" />
          </View>
          <View style={styles.divider} />
          <View style={styles.listRow}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={Colors.primary} />
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>Coverage area</Text>
              <Text style={styles.listSubtitle}>Pune metropolitan response grid</Text>
            </View>
            <Text style={styles.listValue}>40 UNITS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.listRow}>
            <MaterialCommunityIcons name="bell-ring-outline" size={20} color={Colors.warning} />
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>Active alerts</Text>
              <Text style={styles.listSubtitle}>Detection queue awaiting review</Text>
            </View>
            <Text style={styles.listValue}>{activeAlertCount}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.marginMobile, gap: 18, paddingBottom: 40 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  identityCopy: { flex: 1, gap: 4 },
  name: { color: Colors.white, fontSize: 19, fontWeight: '800' },
  role: { color: Colors.onSurfaceVariant, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.tertiary },
  statusText: { color: Colors.tertiary, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  sectionLabel: { color: Colors.onSurfaceVariant, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    minHeight: 88,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
  },
  statValue: { color: Colors.white, fontSize: 25, fontWeight: '800' },
  statLabel: { color: Colors.onSurfaceVariant, fontSize: 11 },
  listCard: { backgroundColor: Colors.surfaceContainer, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, paddingHorizontal: 14 },
  listRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  listCopy: { flex: 1, gap: 3 },
  listTitle: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  listSubtitle: { color: Colors.onSurfaceVariant, fontSize: 11 },
  listValue: { color: Colors.tertiary, fontSize: 10, fontFamily: 'Courier', fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.outlineVariant },
});
