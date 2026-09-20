import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '../theme/colors';
import { MAP_MARKERS, MarkerType, MapPoint } from '../map/mapModel';
import { RouteCoordinate } from '../services/openRouteService';
import { FleetAsset } from '../types';
import { HOSPITAL_LOCATIONS, RESPONSE_STATIONS } from '../dispatch/stations';

interface OpenRouteMapProps {
  selectedMarker: MarkerType;
  onMarkerSelect: (marker: MarkerType) => void;
  fleetAssets?: FleetAsset[];
  droneCoordinate?: RouteCoordinate;
  roverCoordinate?: RouteCoordinate;
  scanRoute?: RouteCoordinate[];
  detectedPeople?: Array<{ id: string; latitude: number; longitude: number }>;
  focusCoordinate?: RouteCoordinate;
  incidentCoordinate?: RouteCoordinate;
  dronePath?: MapPoint[];
  robotPath?: MapPoint[];
  droneRoute?: RouteCoordinate[];
  robotRoute?: RouteCoordinate[];
  dronePosition?: MapPoint;
  roverPosition?: MapPoint;
  showCenters?: boolean;
}

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

function svgPointToCoordinate(point: MapPoint): RouteCoordinate {
  return {
    latitude: 18.56 - (point.y / 540) * 0.12,
    longitude: 73.79 + (point.x / 400) * 0.14,
  };
}

function buildMapHtml(
  selectedMarker: MarkerType,
  fleetAssets: FleetAsset[] = [],
  showCenters = true,
  dronePath?: MapPoint[],
  robotPath?: MapPoint[],
  droneRoute?: RouteCoordinate[],
  robotRoute?: RouteCoordinate[],
  scanRoute?: RouteCoordinate[],
  detectedPeople?: Array<{ id: string; latitude: number; longitude: number }>
  ,focusCoordinate?: RouteCoordinate
  ,incidentCoordinate?: RouteCoordinate
) {
  const route = (nativeRoute?: RouteCoordinate[], fallback?: MapPoint[]) =>
    nativeRoute ?? fallback?.map(svgPointToCoordinate) ?? [];
  const markers = (Object.keys(MAP_MARKERS) as MarkerType[]).map((id) => {
    const coordinate = markerCoordinates[id];
    return {
      id,
      label: MAP_MARKERS[id].label,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      color: markerColors[id],
    };
  });

  const markerJson = JSON.stringify(markers);
  const droneJson = JSON.stringify(route(droneRoute, dronePath));
  const robotJson = JSON.stringify(route(robotRoute, robotPath));
  const scanJson = JSON.stringify(scanRoute ?? []);
  const peopleJson = JSON.stringify(detectedPeople ?? []);
  const incidentJson = JSON.stringify(incidentCoordinate ?? null);
  const focusJson = JSON.stringify(focusCoordinate ?? null);
  const fleetJson = JSON.stringify(
    fleetAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      latitude: asset.homeCoordinates.lat,
      longitude: asset.homeCoordinates.lng,
      color: asset.type === 'drone' ? Colors.tertiary : Colors.primary,
    }))
  );
  const stationJson = JSON.stringify(
    RESPONSE_STATIONS.map((station) => ({
      ...station,
      color: station.type === 'fire' ? Colors.error : Colors.primary,
    }))
  );
  const hospitalJson = JSON.stringify(HOSPITAL_LOCATIONS);

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html, body, #map { margin: 0; width: 100%; height: 100%; background: #0b0d0c; }
.leaflet-control-attribution { font-size: 9px; background: rgba(11,13,12,.8) !important; color: #a9aea4; }
.leaflet-control-attribution a { color: #b8d86a; }
.marker { width: 34px; height: 34px; border: 2px solid; border-radius: 11px; background: rgba(11,13,12,.94); display: grid; place-items: center; color: inherit; font: 700 16px system-ui; }
.label { margin-top: 3px; padding: 2px 5px; border: 1px solid; border-radius: 5px; background: rgba(11,13,12,.9); white-space: nowrap; color: inherit; font: 700 9px system-ui; }
.pin { display: flex; flex-direction: column; align-items: center; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const selected = ${JSON.stringify(selectedMarker)};
const markers = ${markerJson};
const droneRoute = ${droneJson};
const robotRoute = ${robotJson};
const scanRoute = ${scanJson};
const detectedPeople = ${peopleJson};
const incidentCoordinate = ${incidentJson};
const focusCoordinate = ${focusJson};
const fleetAssets = ${fleetJson};
const responseStations = ${stationJson};
const hospitals = ${hospitalJson};
const showCenters = ${JSON.stringify(showCenters)};
const unitMarkers = {};
const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(
  focusCoordinate ? [focusCoordinate.latitude, focusCoordinate.longitude] : [18.54, 73.84],
  focusCoordinate ? 16 : 11
);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
function line(points, color, dash) {
  if (points.length > 1) L.polyline(points.map(p => [p.latitude, p.longitude]), { color, weight: 4, opacity: .9, dashArray: dash }).addTo(map);
}
line(droneRoute, '${Colors.tertiary}', '10 8');
line(robotRoute, '${Colors.warning}', '7 7');
if (scanRoute.length > 1) {
  L.polygon(scanRoute.map(p => [p.latitude, p.longitude]), {
    color: '${Colors.primary}',
    fillColor: '${Colors.primary}',
    fillOpacity: 0.1,
    weight: 3,
    dashArray: '8 5'
  }).addTo(map).bindTooltip('DRONE SEARCH GRID', { permanent: true, direction: 'center' });
}
if (incidentCoordinate) {
  L.circle([incidentCoordinate.latitude, incidentCoordinate.longitude], {
    radius: 180,
    color: '${Colors.error}',
    fillColor: '${Colors.error}',
    fillOpacity: 0.16,
    weight: 2,
    dashArray: '6 5'
  }).addTo(map).bindTooltip('INCIDENT AREA', { permanent: true, direction: 'top' });
}
markers.forEach(item => {
  const icon = L.divIcon({
    className: '',
    html: '<div class="pin" style="color:' + item.color + '"><div class="marker" style="border-color:' + item.color + ';' + (item.id === selected ? 'box-shadow:0 0 14px ' + item.color + ';' : '') + '">' + (item.id === 'drone' ? '✦' : item.id === 'rover' ? '▦' : item.id === 'person' ? '•' : '!') + '</div><div class="label" style="border-color:' + item.color + '80">' + item.label + '</div></div>',
    iconSize: [70, 60],
    iconAnchor: [35, 30]
  });
  const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map);
  unitMarkers[item.id] = marker;
  marker.on('click', () => window.ReactNativeWebView.postMessage(item.id));
});
detectedPeople.forEach(person => {
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border:2px solid ${Colors.warning};border-radius:50%;background:rgba(216,120,109,.85);box-shadow:0 0 10px ${Colors.warning};"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
  L.marker([person.latitude, person.longitude], { icon }).addTo(map).bindTooltip(person.id, { permanent: false });
});
if (showCenters) fleetAssets.forEach(asset => {
  const icon = L.divIcon({
    className: '',
    html: '<div style="display:flex;flex-direction:column;align-items:center;color:' + asset.color + '"><div style="width:22px;height:22px;border:1px solid ' + asset.color + ';border-radius:7px;background:' + asset.color + '55;display:grid;place-items:center;font:700 10px system-ui">' + (asset.type === 'drone' ? '✦' : '▦') + '</div><div style="margin-top:1px;padding:1px 2px;background:rgba(11,13,12,.78);font:700 6px monospace;white-space:nowrap">' + asset.name + '</div></div>',
    iconSize: [55, 35],
    iconAnchor: [27, 14]
  });
  L.marker([asset.latitude, asset.longitude], { icon, interactive: false }).addTo(map);
});
if (showCenters) responseStations.forEach(station => {
  const icon = L.divIcon({
    className: '',
    html: '<div style="display:flex;flex-direction:column;align-items:center"><div style="width:24px;height:24px;border:1px solid ' + station.color + ';border-radius:7px;background:rgba(11,13,12,.9);display:grid;place-items:center;color:' + station.color + ';font:700 12px system-ui">' + (station.type === 'fire' ? '♨' : '✚') + '</div><div style="margin-top:1px;padding:1px 2px;background:rgba(11,13,12,.82);color:#a9aea4;font:700 6px monospace;white-space:nowrap">' + station.name.replace(' Fire Brigade', '').replace(' Police Station', '') + '</div></div>',
    iconSize: [58, 38],
    iconAnchor: [29, 14]
  });
  L.marker([station.coordinates.lat, station.coordinates.lng], { icon, interactive: false }).addTo(map);
});
if (showCenters) hospitals.forEach(hospital => {
  const icon = L.divIcon({
    className: '',
    html: '<div style="display:flex;flex-direction:column;align-items:center"><div style="width:24px;height:24px;border:1px solid #f4f4ef;border-radius:7px;background:rgba(11,13,12,.9);display:grid;place-items:center;color:#f4f4ef;font:700 12px system-ui">✚</div><div style="margin-top:1px;padding:1px 2px;background:rgba(11,13,12,.82);color:#a9aea4;font:700 6px monospace;white-space:nowrap">' + hospital.name.replace(' Hospital', '') + '</div></div>',
    iconSize: [58, 38],
    iconAnchor: [29, 14]
  });
  L.marker([hospital.coordinates.lat, hospital.coordinates.lng], { icon, interactive: false }).addTo(map);
});
if (focusCoordinate) {
  L.circle([focusCoordinate.latitude, focusCoordinate.longitude], {
    radius: 55,
    color: '${Colors.warning}',
    fillColor: '${Colors.warning}',
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '5 4'
  }).addTo(map).bindTooltip('FOCUSED PERSON', { permanent: true, direction: 'top' });
}
function receiveUnitUpdate(event) {
  try {
    const update = JSON.parse(event.data);
    const marker = unitMarkers[update.id];
    if (marker && update.coordinate) {
      marker.setLatLng([update.coordinate.latitude, update.coordinate.longitude]);
    }
  } catch (_) {}
}
document.addEventListener('message', receiveUnitUpdate);
window.addEventListener('message', receiveUnitUpdate);
</script>
</body>
</html>`;
}

export const OpenRouteMap: React.FC<OpenRouteMapProps> = (props) => {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(
    () =>
      buildMapHtml(
        props.selectedMarker,
        props.fleetAssets,
        props.showCenters,
        props.dronePath,
        props.robotPath,
        props.droneRoute,
        props.robotRoute
        ,props.scanRoute
        ,props.detectedPeople
        ,props.focusCoordinate
        ,props.incidentCoordinate
      ),
    [
      props.selectedMarker,
      props.fleetAssets,
      props.showCenters,
      props.dronePath,
      props.robotPath,
      props.droneRoute,
      props.robotRoute,
      props.scanRoute,
      props.detectedPeople,
      props.focusCoordinate,
      props.incidentCoordinate,
    ]
  );
  const source = useMemo(() => ({ html }), [html]);

  useEffect(() => {
    const updates = [
      { id: 'drone', coordinate: props.droneCoordinate ?? (props.dronePosition ? svgPointToCoordinate(props.dronePosition) : undefined) },
      { id: 'rover', coordinate: props.roverCoordinate ?? (props.roverPosition ? svgPointToCoordinate(props.roverPosition) : undefined) },
    ];

    updates.forEach((update) => {
      if (update.coordinate) {
        webViewRef.current?.postMessage(JSON.stringify(update));
      }
    });
  }, [
    props.droneCoordinate?.latitude,
    props.droneCoordinate?.longitude,
    props.roverCoordinate?.latitude,
    props.roverCoordinate?.longitude,
    props.dronePosition?.x,
    props.dronePosition?.y,
    props.roverPosition?.x,
    props.roverPosition?.y,
  ]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const marker = event.nativeEvent.data as MarkerType;
    if (marker in MAP_MARKERS) props.onMarkerSelect(marker);
  };

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={source}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mixedContentMode="always"
        startInLoadingState
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: Colors.surfaceContainerLowest },
  webView: { flex: 1, backgroundColor: Colors.surfaceContainerLowest },
});
