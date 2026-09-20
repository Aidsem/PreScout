import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalBadge } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { MissionHistoryItem } from '../types';
import type { MainTabScreenProps } from '../types/navigation';

export const MissionHistoryScreen: React.FC<MainTabScreenProps<'HistoryTab'>> = ({ navigation }) => {
  const { missionHistory } = useTactical();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const filterTypes = ['All', 'Search & Rescue', 'Containment', 'Recon'];

  const filteredMissions = missionHistory.filter((m) => {
    const matchesSearch =
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'All' || m.type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const exportPayload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        format: 'resqmesh-mission-export',
        missions: filteredMissions,
      },
      null,
      2
    );
    void Share.share({
      title: 'ResQMesh mission export',
      message: exportPayload,
    }).catch((error) => {
      console.warn('Mission export sharing failed.', error);
      Alert.alert('Export unavailable', 'The mission export could not be shared from this device.');
    });
  };

  const handleMissionPress = (mission: MissionHistoryItem) => {
    Alert.alert(
      `${mission.code}: ${mission.title}`,
      `Date: ${mission.date} ${mission.time}\nLocation: ${mission.location}\nCoordinates: ${mission.coordinates}\nStatus: ${mission.status}\nDuration: ${mission.duration}\nTelemetry: ${mission.telemetrySize}\nAssets: ${mission.dronesCount} Drones, ${mission.roversCount} Rovers`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="RESQMESH"
        subtitle="MISSION ARCHIVE & AUDIT LOGS"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Export Action */}
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.pageTitle}>Mission History</Text>
            <Text style={styles.pageSubtitle}>
              Review archived flight telemetry and operational sensor data.
            </Text>
          </View>
        </View>

        {/* Search & Export Row */}
        <View style={styles.searchExportRow}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search operations, sectors..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
            <MaterialCommunityIcons name="download" size={16} color={Colors.primaryContainer} />
            <Text style={styles.exportBtnText}>EXPORT</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filterTypes.map((type) => {
            const isSelected = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Missions Feed */}
        <View style={styles.missionsList}>
          {filteredMissions.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.missionCard}
                onPress={() => handleMissionPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.missionHeader}>
                  <View>
                    <Text style={styles.missionCode}>{item.code}</Text>
                    <Text style={styles.missionTitle}>{item.title}</Text>
                  </View>
                  <TacticalBadge
                    label={item.status}
                    variant={isCompleted ? 'live' : 'info'}
                    size="sm"
                    icon={isCompleted ? 'check-circle' : 'archive'}
                  />
                </View>

                {/* Location & Time */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <View style={styles.inlineIconRow}>
                      <MaterialCommunityIcons name="map-marker" size={13} color={Colors.tertiary} />
                      <Text style={styles.metaLocationText}>{item.location}</Text>
                    </View>
                    <Text style={styles.metaCoordsText}>{item.coordinates}</Text>
                  </View>

                  <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.metaDateText}>{item.date}</Text>
                    <Text style={styles.metaTimeText}>{item.time}</Text>
                  </View>
                </View>

                {/* Bottom Operational Metrics */}
                <View style={styles.missionFooter}>
                  <View style={styles.assetCountsRow}>
                    <View style={styles.assetCountPill}>
                      <MaterialCommunityIcons name="drone" size={13} color={Colors.primary} />
                      <Text style={styles.assetCountNum}>{item.dronesCount}</Text>
                    </View>
                    {item.roversCount > 0 && (
                      <View style={styles.assetCountPill}>
                        <MaterialCommunityIcons name="robot-industrial" size={13} color={Colors.primary} />
                        <Text style={styles.assetCountNum}>{item.roversCount}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metricsRight}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                    <Text style={styles.dataSizeText}>{item.telemetrySize}</Text>
                  </View>
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
  scrollArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerBlock: {
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
    lineHeight: 18,
  },
  searchExportRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Courier',
  },
  exportBtn: {
    height: 44,
    backgroundColor: Colors.primaryFixed,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportBtnText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.onSurface,
  },
  filterChipTextActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  missionsList: {
    gap: 12,
  },
  missionCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    gap: 10,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  missionCode: {
    fontSize: 15,
    fontFamily: 'Courier',
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  missionTitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(69, 71, 75, 0.25)',
    paddingTop: 8,
  },
  metaCol: {
    flex: 1,
  },
  inlineIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLocationText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  metaCoordsText: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginLeft: 17,
  },
  metaDateText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.white,
  },
  metaTimeText: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(69, 71, 75, 0.2)',
  },
  assetCountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  assetCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetCountNum: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: Colors.white,
    fontWeight: '700',
  },
  metricsRight: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.white,
  },
  dataSizeText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
  },
});
