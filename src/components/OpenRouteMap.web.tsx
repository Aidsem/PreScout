import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Polygon, Polyline } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { MAP_MARKERS, MarkerType, MapPoint } from '../map/mapModel';
import { RouteCoordinate } from '../services/openRouteService';
import { DEFAULT_BOUNDS, MapProjection, projectionFromBounds } from '../map/projection';
import { FleetAsset } from '../types';
import { HOSPITAL_LOCATIONS, RESPONSE_STATIONS } from '../dispatch/stations';

interface OpenRouteMapProps {
  selectedMarker: MarkerType;
  onMarkerSelect: (marker: MarkerType) => void;
  fleetAssets?: FleetAsset[];
  showCenters?: boolean;
  droneCoordinate?: RouteCoordinate;
  roverCoordinate?: RouteCoordinate;
  scanRoute?: RouteCoordinate[];
  detectedPeople?: Array<{ id: string; latitude: number; longitude: number }>;
  focusCoordinate?: RouteCoordinate;
  incidentCoordinate?: RouteCoordinate;
  dronePosition?: MapPoint;
  roverPosition?: MapPoint;
  dronePath?: MapPoint[];
  robotPath?: MapPoint[];
  droneRoute?: RouteCoordinate[];
  robotRoute?: RouteCoordinate[];
  projection?: MapProjection;
}

const defaultProjection = projectionFromBounds(DEFAULT_BOUNDS);
const markerCoordinates: Record<MarkerType, RouteCoordinate> = {
  drone: { latitude: 18.5324, longitude: 73.8464 },
  hazard: { latitude: 18.5188, longitude: 73.8624 },
  person: { latitude: 18.5108, longitude: 73.8752 },
  rover: { latitude: 18.4974, longitude: 73.8427 },
};
const markerColors: Record<MarkerType, string> = {
  drone: Colors.tertiary,
  hazard: Colors.error,
  person: Colors.warning,
  rover: Colors.primary,
};

export const OpenRouteMap: React.FC<OpenRouteMapProps> = ({
  selectedMarker,
  onMarkerSelect,
  fleetAssets = [],
  showCenters = true,
  droneCoordinate,
  roverCoordinate,
  droneRoute,
  robotRoute,
  scanRoute,
  detectedPeople = [],
  focusCoordinate,
  incidentCoordinate,
  dronePosition,
  roverPosition,
  projection = defaultProjection,
}) => {
  const bounds = projection.bounds;
  const toCoordinate = projection.toCoordinate;
  const markerPosition = (coordinate: RouteCoordinate) => ({
    left: `${((coordinate.longitude - bounds.west) / (bounds.east - bounds.west)) * 100}%` as `${number}%`,
    top: `${((bounds.north - coordinate.latitude) / (bounds.north - bounds.south)) * 100}%` as `${number}%`,
  });
  const iframeSource =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.west}%2C${bounds.south}%2C${bounds.east}%2C${bounds.north}&layer=mapnik`;

  return (
    <View style={styles.root}>
      <iframe
        title="PreScout operations map"
        src={iframeSource}
        loading="lazy"
        style={{ ...styles.webMap, pointerEvents: 'none' }}
      />
      {scanRoute && scanRoute.length > 1 && (
        <Svg pointerEvents="none" style={styles.scanOverlay} viewBox="0 0 100 100">
          <Polygon
            points={scanRoute
              .map((point) => `${((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100},${((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100}`)
              .join(' ')}
            fill={`${Colors.primary}18`}
            stroke={Colors.primary}
            strokeWidth="0.5"
          />
          <Polyline
            points={scanRoute
              .map((point) => `${((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100},${((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100}`)
              .join(' ')}
            fill="none"
            stroke={Colors.primary}
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
        </Svg>
      )}
      {droneRoute && droneRoute.length > 1 && (
        <Svg pointerEvents="none" style={styles.scanOverlay} viewBox="0 0 100 100">
          <Polyline
            points={droneRoute
              .map((point) => `${((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100},${((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100}`)
              .join(' ')}
            fill="none"
            stroke={Colors.tertiary}
            strokeWidth="1.2"
            strokeDasharray="5 4"
          />
        </Svg>
      )}
      {robotRoute && robotRoute.length > 1 && (
        <Svg pointerEvents="none" style={styles.scanOverlay} viewBox="0 0 100 100">
          <Polyline
            points={robotRoute
              .map((point) => `${((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100},${((bounds.north - point.latitude) / (bounds.north - bounds.south)) * 100}`)
              .join(' ')}
            fill="none"
            stroke="#FBBF24"
            strokeWidth="1.3"
            strokeDasharray="2 2"
          />
        </Svg>
      )}
      {incidentCoordinate && (
        <View pointerEvents="none" style={[styles.incidentArea, markerPosition(incidentCoordinate)]}>
          <View style={styles.incidentAreaRing} />
          <Text style={styles.incidentAreaLabel}>INCIDENT AREA</Text>
        </View>
      )}
      {(Object.keys(MAP_MARKERS) as MarkerType[]).filter((id) => id !== 'hazard' && id !== 'person').map((id) => {
        const marker = MAP_MARKERS[id];
        const coordinate =
          id === 'drone' && droneCoordinate
            ? droneCoordinate
            : id === 'rover' && roverCoordinate
              ? roverCoordinate
              : id === 'drone' && dronePosition
                ? toCoordinate(dronePosition)
            : id === 'rover' && roverPosition
              ? toCoordinate(roverPosition)
              : markerCoordinates[id];
        const color = markerColors[id];
        return (
          <Pressable key={id} style={[styles.webMarker, markerPosition(coordinate)]} onPress={() => onMarkerSelect(id)}>
            <View style={[styles.marker, selectedMarker === id && styles.markerSelected, { borderColor: color }]}>
              <MaterialCommunityIcons name={marker.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={17} color={color} />
            </View>
            <View style={[styles.markerLabel, { borderColor: `${color}80` }]}>
              <Text style={[styles.markerLabelText, { color }]}>{marker.label}</Text>
            </View>
          </Pressable>
        );
      })}
      {detectedPeople.map((person) => (
        <View
          key={person.id}
          pointerEvents="none"
          style={[styles.detectedMarker, markerPosition(person)]}
        >
          <View style={styles.detectedDot} />
          <Text style={styles.detectedLabel}>{person.id}</Text>
        </View>
      ))}
      {showCenters && fleetAssets.map((asset) => {
        const coordinate = {
          latitude: asset.homeCoordinates.lat,
          longitude: asset.homeCoordinates.lng,
        };
        const color = asset.type === 'drone' ? Colors.tertiary : Colors.primary;
        return (
          <View key={asset.id} pointerEvents="none" style={[styles.fleetMarker, markerPosition(coordinate)]}>
            <View style={[styles.fleetDot, { borderColor: color, backgroundColor: `${color}55` }]}>
              <MaterialCommunityIcons
                name={asset.type === 'drone' ? 'drone' : 'robot-industrial'}
                size={10}
                color={color}
              />
            </View>
            <Text style={[styles.fleetLabel, { color }]}>{asset.name}</Text>
          </View>
        );
      })}
      {showCenters && RESPONSE_STATIONS.map((station) => (
        <View key={station.id} pointerEvents="none" style={[styles.stationMarker, markerPosition({
          latitude: station.coordinates.lat,
          longitude: station.coordinates.lng,
        })]}>
          <View style={[styles.stationIcon, { borderColor: station.type === 'fire' ? Colors.error : Colors.primary }]}>
            <MaterialCommunityIcons
              name={station.type === 'fire' ? 'fire-truck' : 'police-station'}
              size={12}
              color={station.type === 'fire' ? Colors.error : Colors.primary}
            />
          </View>
          <Text style={styles.stationLabel}>{station.name.replace(' Fire Brigade', '').replace(' Police Station', '')}</Text>
        </View>
      ))}
      {showCenters && HOSPITAL_LOCATIONS.map((hospital) => (
        <View key={hospital.id} pointerEvents="none" style={[styles.stationMarker, styles.hospitalMarker, markerPosition({
          latitude: hospital.coordinates.lat,
          longitude: hospital.coordinates.lng,
        })]}>
          <View style={styles.hospitalIcon}>
            <MaterialCommunityIcons name="hospital-box-outline" size={12} color={Colors.white} />
          </View>
          <Text style={styles.stationLabel}>{hospital.name.replace(' Hospital', '')}</Text>
        </View>
      ))}
      {focusCoordinate && (
        <View pointerEvents="none" style={[styles.focusMarker, markerPosition(focusCoordinate)]}>
          <View style={styles.focusCrosshair} />
          <Text style={styles.focusLabel}>FOCUSED PERSON</Text>
        </View>
      )}
      <View pointerEvents="none" style={styles.mapNote}>
        <Text style={styles.mapNoteText}>OPENSTREETMAP · OPENROUTESERVICE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: Colors.surfaceContainerLowest },
  webMap: { width: '100%', height: '100%', borderWidth: 0 },
  scanOverlay: { ...StyleSheet.absoluteFill, zIndex: 2 },
  webMarker: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -20 }, { translateY: -20 }] },
  marker: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(11, 13, 12, 0.94)',
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  markerSelected: { shadowColor: Colors.tertiary, shadowOpacity: 0.8, shadowRadius: 10, elevation: 8 },
  markerLabel: {
    marginTop: 4, backgroundColor: 'rgba(11, 13, 12, 0.9)', borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  markerLabelText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  detectedMarker: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -9 }, { translateY: -9 }], zIndex: 4 },
  detectedDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.warning, backgroundColor: Colors.error },
  detectedLabel: { marginTop: 2, color: Colors.warning, fontSize: 8, fontWeight: '700' },
  fleetMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -8 }],
    zIndex: 2,
  },
  fleetDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetLabel: {
    marginTop: 1,
    fontSize: 6,
    fontFamily: 'Courier',
    fontWeight: '700',
    backgroundColor: 'rgba(11, 13, 12, 0.78)',
    paddingHorizontal: 2,
  },
  stationMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -28 }, { translateY: -12 }],
    zIndex: 1,
  },
  hospitalMarker: { transform: [{ translateX: -24 }, { translateY: -12 }] },
  stationIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 13, 12, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.white,
    backgroundColor: 'rgba(11, 13, 12, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationLabel: {
    marginTop: 2,
    color: Colors.onSurfaceVariant,
    fontSize: 6,
    fontFamily: 'Courier',
    fontWeight: '700',
    backgroundColor: 'rgba(11, 13, 12, 0.82)',
    paddingHorizontal: 2,
  },
  focusMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -38 }, { translateY: -38 }],
    zIndex: 5,
  },
  focusCrosshair: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.warning,
    backgroundColor: `${Colors.warning}12`,
  },
  focusLabel: {
    marginTop: 4,
    color: Colors.warning,
    backgroundColor: 'rgba(11, 13, 12, 0.92)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  incidentArea: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -34 }, { translateY: -34 }], zIndex: 3 },
  incidentAreaRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: Colors.error, backgroundColor: `${Colors.error}22` },
  incidentAreaLabel: { marginTop: 2, color: Colors.error, fontSize: 8, fontWeight: '700' },
  mapNote: {
    position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(11, 13, 12, 0.82)',
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4,
  },
  mapNoteText: { color: Colors.onSurfaceVariant, fontSize: 8, letterSpacing: 0.6 },
});
