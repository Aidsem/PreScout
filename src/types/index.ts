export type IncidentType = 'medical' | 'sar' | 'fire' | 'flood' | 'landslide' | 'missing';
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'ACTIVE' | 'EN ROUTE' | 'SEARCH ACTIVE' | 'CONTAINED' | 'RESOLVED';

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  priority: IncidentPriority;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  assignedAsset: string;
  status: IncidentStatus;
  timestamp: string;
  imageUrl?: string;
  description: string;
  estimatedPeople?: number;
}

export type AssetType = 'drone' | 'rover';
export type AssetStatus = 'AVAILABLE' | 'ON MISSION' | 'CHARGING' | 'MAINTENANCE';
export type StationType = 'fire' | 'police';

export interface ResponseStation {
  id: string;
  name: string;
  type: StationType;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FleetAsset {
  id: string;
  name: string;
  type: AssetType;
  subType: string;
  status: AssetStatus;
  battery: number;
  signal: 'Strong' | 'Moderate' | 'Weak';
  payload: string;
  stationId: string;
  stationName: string;
  homeCoordinates: {
    lat: number;
    lng: number;
  };
  assignedIncidentId?: string;
  eta?: string;
}

export interface DispatchResult {
  incident: Incident;
  drone?: FleetAsset;
  rover?: FleetAsset;
}

export interface DetectionAlert {
  id: string;
  title: string;
  type: 'PERSON' | 'HAZARD' | 'VEHICLE' | 'THERMAL';
  confidence: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  sourceFeed: string;
  coordinates: string;
  status: 'ACTIVE' | 'RESOLVED';
  flirCameraModel: string;
  altitude: number;
  azimuth: number;
}

export interface TelemetryState {
  altitude: number;
  speed: number;
  battery: number;
  signal: 'Strong' | 'Moderate' | 'Weak';
  distance: number;
  eta: string;
  cameraMode: 'RGB' | 'THERMAL';
  connected: boolean;
}

export interface SystemLog {
  id: string;
  time: string;
  category: 'SYS' | 'NAV' | 'AI' | 'COMM';
  message: string;
  level: 'info' | 'warning' | 'alert';
}

export interface MissionHistoryItem {
  id: string;
  code: string;
  title: string;
  type: 'Search & Rescue' | 'Containment' | 'Recon' | 'Medical Emergency';
  date: string;
  time: string;
  location: string;
  coordinates: string;
  status: 'COMPLETED' | 'ARCHIVED' | 'ABORTED';
  dronesCount: number;
  roversCount: number;
  duration: string;
  telemetrySize: string;
}

export interface MissionParameters {
  unitId: string;
  droneUnitId: string;
  roverUnitId: string;
  type: string;
  areaKm2: number;
  altitude: number;
  speed: number;
  geofenceEnabled: boolean;
  aiProfile: 'Person + Hazard' | 'Thermal Signatures' | 'Structural Damage';
}
