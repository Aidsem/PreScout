import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors, Spacing } from '../theme/colors';
import { TacticalHeader, TacticalButton } from '../components/TacticalComponents';
import { useTactical } from '../context/TacticalContext';
import { IncidentPriority, IncidentType } from '../types';
import { openScreen } from '../navigation/openScreen';
import type { RootStackScreenProps } from '../types/navigation';

interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface PhotonFeature {
  properties?: {
    osm_id?: number;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export const CreateIncidentScreen: React.FC<RootStackScreenProps<'CreateIncident'>> = ({ navigation }) => {
  const { dispatchIncident } = useTactical();

  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('sar');
  const [priority, setPriority] = useState<IncidentPriority>('critical');
  const [estimatedPeople, setEstimatedPeople] = useState('');
  const [coordinates, setCoordinates] = useState('18.5204° N, 73.8567° E');
  const [locationName, setLocationName] = useState('Sector 7 Delta, Pune');
  const [locationMode, setLocationMode] = useState<'live' | 'search'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);

  const incidentTypes: { key: IncidentType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'sar', label: 'Search & Rescue', icon: 'account-search' },
    { key: 'flood', label: 'Flood Surge', icon: 'water-alert' },
    { key: 'fire', label: 'Wildfire', icon: 'fire' },
    { key: 'medical', label: 'Medical Emergency', icon: 'hospital-box' },
    { key: 'landslide', label: 'Landslide', icon: 'terrain' },
    { key: 'missing', label: 'Missing Person', icon: 'account-question' },
  ];

  const priorityLevels: { key: IncidentPriority; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
    { key: 'critical', label: 'Critical', icon: 'alert', color: Colors.error },
    { key: 'high', label: 'High', icon: 'bell-ring', color: Colors.warning },
    { key: 'medium', label: 'Medium', icon: 'information', color: Colors.primary },
    { key: 'low', label: 'Low', icon: 'arrow-down-bold-circle', color: Colors.tertiary },
  ];

  useEffect(() => {
    if (locationMode !== 'search' || searchQuery.trim().length < 3) {
      setSuggestions([]);
      setSearchingPlaces(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingPlaces(true);
      setSearchError('');
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?limit=5&lang=en&q=${encodeURIComponent(searchQuery.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Place search failed with status ${response.status}`);
        const data = (await response.json()) as PhotonResponse;
        const places = (data.features ?? []).flatMap((feature, index) => {
          const coordinates = feature.geometry?.coordinates;
          if (!coordinates || coordinates.length < 2) return [];
          const properties = feature.properties ?? {};
          const displayName = [
            properties.name,
            properties.street,
            properties.city,
            properties.state,
            properties.country,
          ]
            .filter(Boolean)
            .filter((value, valueIndex, values) => values.indexOf(value) === valueIndex)
            .join(', ');
          if (!displayName) return [];
          return [{
            place_id: String(properties.osm_id ?? `${searchQuery}-${index}`),
            display_name: displayName,
            lat: String(coordinates[1]),
            lon: String(coordinates[0]),
          }];
        });
        setSuggestions(places);
        if (places.length === 0) setSearchError('No matching locations found.');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('Unable to search for incident locations.', error);
          setSuggestions([]);
          setSearchError('Location search is unavailable. Check your connection and try again.');
        }
      } finally {
        setSearchingPlaces(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationMode, searchQuery]);

  const formatCoordinates = (latitude: number, longitude: number) =>
    `${Math.abs(latitude).toFixed(6)}° ${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(6)}° ${longitude >= 0 ? 'E' : 'W'}`;

  const choosePlace = (place: PlaceSuggestion) => {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);
    setSelectedPlace(place.display_name);
    setSearchQuery(place.display_name);
    setSuggestions([]);
    setLocationName(place.display_name);
    setCoordinates(formatCoordinates(latitude, longitude));
  };

  const handleUseGPS = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Location permission required',
        'Allow location access to use your current position for this incident.'
      );
      return;
    }

    let position: Location.LocationObject;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.warn('Unable to read the current device location.', error);
      Alert.alert('Location unavailable', 'We could not read your current position. Enter the coordinates manually or try again.');
      return;
    }
    const { latitude, longitude } = position.coords;
    setCoordinates(formatCoordinates(latitude, longitude));
    setLocationName(`Current device location (±${Math.round(position.coords.accuracy ?? 0)}m)`);
    setSelectedPlace('');
    setSearchQuery('');
    setSuggestions([]);
    Alert.alert('Location acquired', 'The incident will be reported from your current device position.');
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to take an incident photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) setEvidenceUri(result.assets[0].uri);
  };

  const handleUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow photo access to attach an incident image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) setEvidenceUri(result.assets[0].uri);
  };

  const handleSubmit = () => {
    const coordinateMatch = coordinates.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NS])\s*,\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])\s*$/i
    );

    if (!coordinateMatch) {
      Alert.alert(
        'Invalid coordinates',
        'Use the format 18.5204° N, 73.8567° E before creating the incident.'
      );
      return;
    }

    const latitude = Number(coordinateMatch[1]) * (coordinateMatch[2].toUpperCase() === 'S' ? -1 : 1);
    const longitude = Number(coordinateMatch[3]) * (coordinateMatch[4].toUpperCase() === 'W' ? -1 : 1);
    const parsedPeople = estimatedPeople.trim() === '' ? undefined : Number(estimatedPeople);
    if (parsedPeople !== undefined && (!Number.isInteger(parsedPeople) || parsedPeople < 1)) {
      Alert.alert('Invalid headcount', 'Estimated people affected must be a whole number of 1 or more, or left blank if unknown.');
      return;
    }
    const finalTitle = title.trim() || `${incidentTypes.find((t) => t.key === incidentType)?.label} Operation`;
    const finalDesc = description.trim() || 'Tactical mission initialized. Asset allocation and perimeter surveillance active.';

    const dispatch = dispatchIncident({
      title: finalTitle,
      type: incidentType,
      priority: priority,
      estimatedPeople: parsedPeople,
      location: locationName,
      coordinates: { lat: latitude, lng: longitude },
      assignedAsset: 'Awaiting station dispatch',
      status: 'ACTIVE',
      imageUrl: evidenceUri ?? undefined,
      description: finalDesc,
    });

    Alert.alert(
      'Incident Dispatched',
      `${finalTitle} created with ${priority.toUpperCase()} priority.\n\n${dispatch.drone?.name ?? 'No drone available'} from ${dispatch.drone?.stationName ?? 'the nearest fire brigade'} and ${dispatch.rover?.name ?? 'no robot available'} from ${dispatch.rover?.stationName ?? 'the nearest police station'} were notified.`,
      [
        {
          text: 'Open Mission Map',
          onPress: () => openScreen(navigation, 'LiveMap'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainer} />
      <TacticalHeader
        title="PRESCOUT"
        subtitle="INCIDENT INITIALIZATION PROTOCOL"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.formTitle}>Create New Incident</Text>
          <Text style={styles.formSubtitle}>
            Initialize tactical response protocols and dispatch assets.
          </Text>
        </View>

        {/* Incident Custom Title */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>INCIDENT TITLE / DESIGNATION</Text>
          <TextInput
            style={styles.textInputDark}
            placeholder="e.g. Flash Flood Sector-4 Triage"
            placeholderTextColor={Colors.outline}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Incident Type Grid */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>INCIDENT TYPE</Text>
          <View style={styles.typeGrid}>
            {incidentTypes.map((item) => {
              const isSelected = incidentType === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                  onPress={() => setIncidentType(item.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={isSelected ? Colors.tertiary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Priority Level Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>PRIORITY LEVEL</Text>
          <View style={styles.priorityRow}>
            {priorityLevels.map((p) => {
              const isSelected = priority === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.priorityCard,
                    isSelected && {
                      borderColor: p.color,
                      backgroundColor: `${p.color}20`,
                    },
                  ]}
                  onPress={() => setPriority(p.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={p.icon}
                    size={20}
                    color={p.color}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      isSelected && { color: p.color, fontWeight: '700' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Estimated People Affected */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>ESTIMATED PEOPLE AFFECTED</Text>
          <TextInput
            style={styles.textInputDark}
            placeholder="Leave blank if unknown"
            placeholderTextColor={Colors.outline}
            keyboardType="number-pad"
            value={estimatedPeople}
            onChangeText={setEstimatedPeople}
          />
        </View>

        {/* Location Acquisition */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>LOCATION ACQUISITION</Text>
          <View style={styles.locationActionsRow}>
            <TouchableOpacity
              style={[styles.locButton, locationMode === 'live' && styles.locButtonActive]}
              onPress={() => {
                setLocationMode('live');
                void handleUseGPS();
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={Colors.tertiary} />
              <Text style={styles.locButtonText}>LIVE LOCATION</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locButton, locationMode === 'search' && styles.locButtonActive]}
              onPress={() => setLocationMode('search')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="map-search-outline" size={18} color={Colors.primary} />
              <Text style={styles.locButtonText}>SEARCH PLACE</Text>
            </TouchableOpacity>
          </View>

          {locationMode === 'search' && (
            <View style={styles.searchBox}>
              <View style={styles.searchInputRow}>
                <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search address, landmark or area"
                  placeholderTextColor={Colors.outline}
                  value={searchQuery}
                  onChangeText={(value) => {
                    setSearchQuery(value);
                    setSelectedPlace('');
                  }}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchingPlaces && <MaterialCommunityIcons name="loading" size={18} color={Colors.tertiary} />}
              </View>
              {suggestions.length > 0 && (
                <View style={styles.suggestionsList}>
                  {suggestions.map((place) => (
                    <TouchableOpacity
                      key={place.place_id}
                      style={styles.suggestionRow}
                      onPress={() => choosePlace(place)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="map-marker-outline" size={18} color={Colors.tertiary} />
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {place.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <Text style={styles.searchHint}>Type at least 3 characters to search.</Text>
              )}
              {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
              {selectedPlace ? (
                <Text style={styles.selectedPlaceText} numberOfLines={2}>
                  Selected: {selectedPlace}
                </Text>
              ) : null}
            </View>
          )}

          <TextInput
            style={[styles.textInputDark, { marginTop: 8 }]}
            placeholder="Coordinates appear after selecting a location"
            placeholderTextColor={Colors.outline}
            value={coordinates}
            onChangeText={setCoordinates}
          />
        </View>

        {/* Situation Report / Description */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>SITUATION REPORT / DESCRIPTION</Text>
          <TextInput
            style={[styles.textInputDark, styles.textAreaDark]}
            placeholder="Provide detailed situational awareness, victim count, hazards..."
            placeholderTextColor={Colors.outline}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Evidence & Media */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>EVIDENCE & SENSOR ATTACHMENTS</Text>
          {evidenceUri ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: evidenceUri }} style={styles.evidencePreview} />
              <View style={styles.previewOverlay}>
                <Text style={styles.uploadTitle}>Photo attached</Text>
                <TouchableOpacity onPress={() => setEvidenceUri(null)} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="close-circle" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.uploadOption} onPress={handleTakePhoto} activeOpacity={0.8}>
                <MaterialCommunityIcons name="camera-outline" size={24} color={Colors.tertiary} />
                <Text style={styles.uploadTitle}>Take photo</Text>
                <Text style={styles.uploadSub}>Use device camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOption} onPress={handleUploadPhoto} activeOpacity={0.8}>
                <MaterialCommunityIcons name="image-multiple-outline" size={24} color={Colors.primary} />
                <Text style={styles.uploadTitle}>Upload photo</Text>
                <Text style={styles.uploadSub}>Choose from library</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form Action Triggers */}
        <View style={styles.formActionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>CREATE INCIDENT & PLAN MISSION</Text>
          </TouchableOpacity>
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
    gap: 18,
  },
  headerBlock: {
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  formSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  textInputDark: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Courier',
  },
  textAreaDark: {
    height: 90,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeButtonSelected: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(184, 216, 106, 0.1)',
  },
  typeButtonText: {
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: Colors.tertiary,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    color: Colors.onSurface,
  },
  locationActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locButton: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  locButtonActive: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(184, 216, 106, 0.1)',
  },
  locButtonText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  searchBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  searchInputRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    paddingVertical: 10,
  },
  suggestionsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  suggestionRow: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  suggestionText: {
    flex: 1,
    color: Colors.onSurface,
    fontSize: 12,
    lineHeight: 17,
  },
  searchHint: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  searchError: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    color: Colors.error,
    fontSize: 11,
  },
  selectedPlaceText: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    color: Colors.tertiary,
    fontSize: 11,
  },
  uploadBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadBoxActive: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(184, 216, 106, 0.08)',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadOption: {
    flex: 1,
    minHeight: 118,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  previewBox: {
    height: 170,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surfaceContainerLow,
  },
  evidencePreview: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 13, 12, 0.78)',
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
  },
  uploadSub: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 1,
  },
  submitBtn: {
    flex: 2,
    height: 52,
    backgroundColor: Colors.accentBlue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  submitBtnText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
