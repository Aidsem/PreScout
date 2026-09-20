import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Incident,
  FleetAsset,
  DetectionAlert,
  TelemetryState,
  SystemLog,
  MissionHistoryItem,
  MissionParameters,
  DispatchResult,
} from '../types';
import { RESPONSE_STATIONS, distanceBetween } from '../dispatch/stations';
import { nextId } from '../utils/id';

export type AssignmentResult = { ok: true } | { ok: false; reason: string };

function assignedLabel(assets: FleetAsset[], incidentId: string): string {
  const names = assets
    .filter((asset) => asset.assignedIncidentId === incidentId)
    .map((asset) => asset.name);
  return names.length ? `${names.join(' + ')} assigned` : 'No units assigned';
}

interface TacticalContextType {
  incidents: Incident[];
  assets: FleetAsset[];
  alerts: DetectionAlert[];
  telemetry: TelemetryState;
  logs: SystemLog[];
  missionHistory: MissionHistoryItem[];
  recordMission: (record: Omit<MissionHistoryItem, 'id'>) => MissionHistoryItem;
  missionParams: MissionParameters;
  addIncident: (incident: Omit<Incident, 'id' | 'timestamp'>) => void;
  dispatchIncident: (incident: Omit<Incident, 'id' | 'timestamp'>) => DispatchResult;
  latestDispatch?: DispatchResult;
  assignAsset: (assetId: string, incidentId: string) => AssignmentResult;
  unassignAsset: (assetId: string) => AssignmentResult;
  toggleCameraMode: () => void;
  resolveAlert: (alertId: string) => void;
  appendLog: (category: SystemLog['category'], message: string, level?: SystemLog['level']) => void;
  updateMissionParams: (params: Partial<MissionParameters>) => void;
  startFlightSimulation: () => void;
  flightSimToken: number;
  activeMissionCount: number;
  onlineAssetCount: number;
  activeAlertCount: number;
}

const initialIncidents: Incident[] = [
  {
    id: 'inc-01',
    title: 'Flood Rescue',
    type: 'flood',
    priority: 'critical',
    location: 'Pune, Maharashtra',
    coordinates: { lat: 18.5204, lng: 73.8567 },
    assignedAsset: 'Drone-01 Assigned',
    status: 'ACTIVE',
    timestamp: '14:20 UTC',
    description: 'High water levels in residential zones. Structural flooding reported with multiple citizens stranded on rooftops.',
  },
  {
    id: 'inc-02',
    title: 'Missing Person',
    type: 'missing',
    priority: 'high',
    location: 'Forest Zone Sector-B',
    coordinates: { lat: 18.5501, lng: 73.8112 },
    assignedAsset: 'Drone-03 + Rover-02',
    status: 'SEARCH ACTIVE',
    timestamp: '13:45 UTC',
    description: 'Hiker missing in dense woodland area. Thermal FLIR sweep initiated to trace human infrared signatures.',
  },
  {
    id: 'inc-03',
    title: 'Medical Emergency',
    type: 'medical',
    priority: 'medium',
    location: 'City Center Square',
    coordinates: { lat: 18.5167, lng: 73.8562 },
    assignedAsset: 'Responder-04',
    status: 'EN ROUTE',
    timestamp: '12:10 UTC',
    description: 'Critical patient extraction required due to blocked civilian access routes. Ground responder deployed.',
  },
];

const initialAssets: FleetAsset[] = [
  ...Array.from({ length: 20 }, (_, index) => {
    const station = RESPONSE_STATIONS.filter((item) => item.type === 'fire')[index % RESPONSE_STATIONS.filter((item) => item.type === 'fire').length];
    const specialStates: FleetAsset['status'][] = ['AVAILABLE', 'ON MISSION', 'AVAILABLE', 'CHARGING'];
    const status = index < 4 ? specialStates[index] : 'AVAILABLE';
    return {
      id: `drone-${String(index + 1).padStart(2, '0')}`,
      name: `DRONE-${String(index + 1).padStart(2, '0')}`,
      type: 'drone' as const,
      subType: index % 3 === 0 ? 'Recon Drone' : index % 3 === 1 ? 'Search Drone' : 'Mesh Relay Drone',
      status,
      battery: Math.max(22, 96 - index * 4),
      signal: index === 1 ? 'Moderate' as const : 'Strong' as const,
      payload: index % 3 === 0 ? 'RGB + Thermal FLIR' : index % 3 === 1 ? 'High-Res Optical Zoom' : 'Mesh Repeater Node',
      stationId: station.id,
      stationName: station.name,
      homeCoordinates: { lat: station.coordinates.lat, lng: station.coordinates.lng },
      ...(status === 'ON MISSION' ? { assignedIncidentId: 'inc-02', eta: '14m' } : {}),
      ...(status === 'CHARGING' ? { eta: 'Charging (25m)' } : {}),
    };
  }),
  ...Array.from({ length: 20 }, (_, index) => {
    const station = RESPONSE_STATIONS.filter((item) => item.type === 'police')[index % RESPONSE_STATIONS.filter((item) => item.type === 'police').length];
    const status: FleetAsset['status'] = index === 1 ? 'ON MISSION' : 'AVAILABLE';
    return {
      id: `rover-${String(index + 1).padStart(2, '0')}`,
      name: `ROVER-${String(index + 1).padStart(2, '0')}`,
      type: 'rover' as const,
      subType: index % 3 === 0 ? 'Ground Robot' : index % 3 === 1 ? 'Tactical Recon' : 'Rapid Response Robot',
      status,
      battery: Math.max(38, 94 - index * 3),
      signal: index === 4 ? 'Moderate' as const : 'Strong' as const,
      payload: index % 3 === 0 ? 'All-Terrain Lifter & Sensor Pack' : index % 3 === 1 ? 'Acoustic Life Detector' : 'Medical Supply & Loudhailer',
      stationId: station.id,
      stationName: station.name,
      homeCoordinates: { lat: station.coordinates.lat, lng: station.coordinates.lng },
      ...(status === 'ON MISSION' ? { assignedIncidentId: 'inc-02', eta: '18m' } : { eta: 'Immediate' }),
    };
  }),
];

const initialAlerts: DetectionAlert[] = [
  {
    id: 'det-01',
    title: 'PERSON DETECTED',
    type: 'PERSON',
    confidence: 94,
    severity: 'Critical',
    timestamp: '14:22:04 UTC',
    sourceFeed: 'Drone-01 (Thermal FLIR)',
    coordinates: '18.5204° N, 73.8567° E',
    status: 'ACTIVE',
    flirCameraModel: 'FLIR T-800 HD',
    altitude: 120,
    azimuth: 184,
  },
  {
    id: 'det-02',
    title: 'FLOOD SURGE HAZARD',
    type: 'HAZARD',
    confidence: 88,
    severity: 'High',
    timestamp: '14:15:30 UTC',
    sourceFeed: 'Drone-02 (Optical)',
    coordinates: '18.5310° N, 73.8610° E',
    status: 'ACTIVE',
    flirCameraModel: 'RGB Optical 4K',
    altitude: 145,
    azimuth: 210,
  },
  {
    id: 'det-03',
    title: 'HEAT SIGNATURE CLUSTER',
    type: 'THERMAL',
    confidence: 91,
    severity: 'High',
    timestamp: '14:02:11 UTC',
    sourceFeed: 'Rover-02 (Sensors)',
    coordinates: '18.5490° N, 73.8150° E',
    status: 'ACTIVE',
    flirCameraModel: 'Thermal FLIR',
    altitude: 0,
    azimuth: 95,
  },
  {
    id: 'det-04',
    title: 'STRUCTURAL DAMAGE DETECTED',
    type: 'HAZARD',
    confidence: 79,
    severity: 'Medium',
    timestamp: '13:50:22 UTC',
    sourceFeed: 'Drone-01 (Thermal FLIR)',
    coordinates: '18.5255° N, 73.8590° E',
    status: 'ACTIVE',
    flirCameraModel: 'FLIR T-800 HD',
    altitude: 110,
    azimuth: 160,
  },
];

const initialLogs: SystemLog[] = [
  { id: 'log-1', time: '14:22', category: 'AI', message: 'Person detected with 94% confidence in Sector 7.', level: 'alert' },
  { id: 'log-2', time: '14:21', category: 'SYS', message: 'Drone-01 reached target search waypoint.', level: 'info' },
  { id: 'log-3', time: '14:20', category: 'SYS', message: 'Switched sensor stream to thermal imaging mode.', level: 'info' },
  { id: 'log-4', time: '14:15', category: 'NAV', message: 'Recalculating search perimeter for wind speed (14kt).', level: 'warning' },
  { id: 'log-5', time: '14:10', category: 'COMM', message: 'Mesh uplink established with Mobile Command Center.', level: 'info' },
];

const initialHistory: MissionHistoryItem[] = [
  {
    id: 'hist-01',
    code: 'OP-ALPHA-77',
    title: 'Wildfire Containment',
    type: 'Containment',
    date: '2024-10-24',
    time: '08:15:00 UTC',
    location: 'Sector 4, North Ridge',
    coordinates: '45.2°N, -121.8°W',
    status: 'COMPLETED',
    dronesCount: 2,
    roversCount: 1,
    duration: '04:22:15',
    telemetrySize: '4.2 GB Telemetry',
  },
  {
    id: 'hist-02',
    code: 'OP-BRAVO-12',
    title: 'Echo Valley SAR',
    type: 'Search & Rescue',
    date: '2024-10-18',
    time: '14:30:00 UTC',
    location: 'Echo Valley Sector-9',
    coordinates: '44.8°N, -122.1°W',
    status: 'ARCHIVED',
    dronesCount: 3,
    roversCount: 2,
    duration: '06:12:40',
    telemetrySize: '6.8 GB Telemetry',
  },
  {
    id: 'hist-03',
    code: 'OP-DELTA-09',
    title: 'Coastal Flash Flood Triage',
    type: 'Medical Emergency',
    date: '2024-10-09',
    time: '19:45:00 UTC',
    location: 'Bay Area Sector 3',
    coordinates: '37.8°N, -122.4°W',
    status: 'COMPLETED',
    dronesCount: 4,
    roversCount: 1,
    duration: '08:05:10',
    telemetrySize: '9.1 GB Telemetry',
  },
  {
    id: 'hist-04',
    code: 'OP-ECHO-31',
    title: 'Mountain Ridge Recon',
    type: 'Recon',
    date: '2024-09-28',
    time: '06:00:00 UTC',
    location: 'Alpine Zone Delta',
    coordinates: '46.1°N, -121.5°W',
    status: 'ARCHIVED',
    dronesCount: 2,
    roversCount: 0,
    duration: '03:15:00',
    telemetrySize: '3.4 GB Telemetry',
  },
];

const TacticalContext = createContext<TacticalContextType | undefined>(undefined);

export const TacticalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [assets, setAssets] = useState<FleetAsset[]>(initialAssets);
  const [alerts, setAlerts] = useState<DetectionAlert[]>(initialAlerts);
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryItem[]>(initialHistory);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    altitude: 120,
    speed: 11.8,
    battery: 78,
    signal: 'Strong',
    distance: 1.8,
    eta: '04:32',
    cameraMode: 'THERMAL',
    connected: true,
  });

  const [flightSimToken, setFlightSimToken] = useState(0);
  const [latestDispatch, setLatestDispatch] = useState<DispatchResult>();

  const [missionParams, setMissionParams] = useState<MissionParameters>({
    unitId: 'drone-01',
    droneUnitId: 'drone-01',
    roverUnitId: 'rover-01',
    type: 'SAR',
    areaKm2: 2.4,
    altitude: 120,
    speed: 12,
    geofenceEnabled: true,
    aiProfile: 'Person + Hazard',
  });

  // Simulated live telemetry micro-pulsing for tactical realism
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        altitude: Math.round((120 + (Math.random() * 4 - 2)) * 10) / 10,
        speed: Math.round((11.8 + (Math.random() * 0.6 - 0.3)) * 10) / 10,
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const dispatchIncident = (newIncidentData: Omit<Incident, 'id' | 'timestamp'>): DispatchResult => {
    const target = newIncidentData.coordinates;
    const availableDrone = assets
      .filter((asset) => asset.type === 'drone' && asset.status === 'AVAILABLE')
      .sort((a, b) => {
        const aDistance = distanceBetween(a.homeCoordinates, target);
        const bDistance = distanceBetween(b.homeCoordinates, target);
        return aDistance - bDistance;
      })[0];
    const availableRover = assets
      .filter((asset) => asset.type === 'rover' && asset.status === 'AVAILABLE')
      .sort((a, b) => {
        const aDistance = distanceBetween(a.homeCoordinates, target);
        const bDistance = distanceBetween(b.homeCoordinates, target);
        return aDistance - bDistance;
      })[0];
    const incidentId = nextId('inc');
    const assignedNames = [availableDrone?.name, availableRover?.name].filter(Boolean);
    const newInc: Incident = {
      ...newIncidentData,
      id: incidentId,
      timestamp: 'Just now',
      status: availableDrone || availableRover ? 'EN ROUTE' : 'ACTIVE',
      assignedAsset: assignedNames.length ? `${assignedNames.join(' + ')} dispatched` : 'No units available',
    };

    setIncidents((prev) => [newInc, ...prev]);
    setLatestDispatch({ incident: newInc, drone: availableDrone, rover: availableRover });
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === availableDrone?.id || asset.id === availableRover?.id
          ? {
              ...asset,
              status: 'ON MISSION',
              assignedIncidentId: incidentId,
              eta: asset.type === 'drone' ? 'Immediate launch' : 'Road route calculating',
            }
          : asset
      )
    );

    const dispatchSummary = [
      availableDrone
        ? `${availableDrone.name} from ${availableDrone.stationName}`
        : 'no available fire-brigade drone',
      availableRover
        ? `${availableRover.name} from ${availableRover.stationName}`
        : 'no available police-station robot',
    ].join('; ');
    const newLog: SystemLog = {
      id: nextId('log'),
      time: new Date().toISOString().substring(11, 16),
      category: 'COMM',
      message: `Incident ${newInc.id} dispatched immediately: ${dispatchSummary}.`,
      level: availableDrone && availableRover ? 'alert' : 'warning',
    };
    setLogs((prev) => [newLog, ...prev]);

    return { incident: newInc, drone: availableDrone, rover: availableRover };
  };

  const addIncident = (newIncidentData: Omit<Incident, 'id' | 'timestamp'>) => {
    dispatchIncident(newIncidentData);
  };


  const assignAsset = (assetId: string, incidentId: string): AssignmentResult => {
    const asset = assets.find((item) => item.id === assetId);
    const incident = incidents.find((item) => item.id === incidentId);
    if (!asset) return { ok: false, reason: 'Unknown asset.' };
    if (!incident || incident.status === 'RESOLVED') {
      return { ok: false, reason: 'Pick an active incident to assign this unit to.' };
    }
    if (asset.status !== 'AVAILABLE') {
      return { ok: false, reason: `${asset.name} is ${asset.status.toLowerCase()} and cannot be assigned.` };
    }

    const nextAssets = assets.map((item) =>
      item.id === assetId
        ? { ...item, status: 'ON MISSION' as const, assignedIncidentId: incidentId, eta: 'Dispatching' }
        : item
    );
    setAssets(nextAssets);
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === incidentId
          ? {
              ...item,
              assignedAsset: assignedLabel(nextAssets, incidentId),
              status: item.status === 'ACTIVE' ? 'EN ROUTE' : item.status,
            }
          : item
      )
    );
    appendLog('COMM', `${asset.name} assigned to ${incident.title} (${incident.id}) by operator.`, 'info');
    return { ok: true };
  };

  const unassignAsset = (assetId: string): AssignmentResult => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return { ok: false, reason: 'Unknown asset.' };
    if (asset.status !== 'ON MISSION') return { ok: false, reason: `${asset.name} is not on a mission.` };

    const incidentId = asset.assignedIncidentId;
    const nextAssets = assets.map((item) =>
      item.id === assetId
        ? { ...item, status: 'AVAILABLE' as const, assignedIncidentId: undefined, eta: 'Immediate' }
        : item
    );
    setAssets(nextAssets);
    if (incidentId) {
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === incidentId ? { ...item, assignedAsset: assignedLabel(nextAssets, incidentId) } : item
        )
      );
    }
    appendLog('COMM', `${asset.name} released from ${incidentId ?? 'its mission'} by operator.`, 'info');
    return { ok: true };
  };

  const toggleCameraMode = () => {
    setTelemetry((prev) => {
      const nextMode = prev.cameraMode === 'RGB' ? 'THERMAL' : 'RGB';
      // Append log
      const newLog: SystemLog = {
        id: nextId('log'),
        time: new Date().toISOString().substring(11, 16),
        category: 'SYS',
        message: `Camera mode toggled to ${nextMode}`,
        level: 'info',
      };
      setLogs((l) => [newLog, ...l]);
      return { ...prev, cameraMode: nextMode };
    });
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, status: 'RESOLVED' } : alert
      )
    );
    const newLog: SystemLog = {
      id: nextId('log'),
      time: new Date().toISOString().substring(11, 16),
      category: 'AI',
      message: `Detection alert #${alertId} marked as RESOLVED by operator.`,
      level: 'info',
    };
    setLogs((l) => [newLog, ...l]);
  };

  const recordMission = (record: Omit<MissionHistoryItem, 'id'>): MissionHistoryItem => {
    const entry: MissionHistoryItem = { ...record, id: nextId('hist') };
    setMissionHistory((prev) => [entry, ...prev]);
    appendLog('SYS', `${entry.code} ${entry.status.toLowerCase()}: ${entry.title} (${entry.duration}).`, 'info');
    return entry;
  };

  const updateMissionParams = (params: Partial<MissionParameters>) => {
    setMissionParams((prev) => ({ ...prev, ...params }));
  };

  const startFlightSimulation = () => {
    setFlightSimToken((n) => n + 1);
  };

  const appendLog = (
    category: SystemLog['category'],
    message: string,
    level: SystemLog['level'] = 'info'
  ) => {
    setLogs((prev) => [
      {
        id: nextId('log'),
        time: new Date().toISOString().substring(11, 16),
        category,
        message,
        level,
      },
      ...prev,
    ]);
  };

  const activeMissionCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const onlineAssetCount = assets.filter((a) => a.status !== 'CHARGING' && a.status !== 'MAINTENANCE').length;
  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <TacticalContext.Provider
      value={{
        incidents,
        assets,
        alerts,
        telemetry,
        logs,
        missionHistory,
        recordMission,
        missionParams,
        addIncident,
        dispatchIncident,
        latestDispatch,
        assignAsset,
        unassignAsset,
        toggleCameraMode,
        resolveAlert,
        appendLog,
        updateMissionParams,
        startFlightSimulation,
        flightSimToken,
        activeMissionCount,
        onlineAssetCount,
        activeAlertCount,
      }}
    >
      {children}
    </TacticalContext.Provider>
  );
};

export const useTactical = () => {
  const context = useContext(TacticalContext);
  if (!context) {
    throw new Error('useTactical must be used within a TacticalProvider');
  }
  return context;
};
