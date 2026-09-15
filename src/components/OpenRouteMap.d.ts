import type React from 'react';
import type { MapPoint, MarkerType } from '../map/mapModel';
import type { RouteCoordinate } from '../services/openRouteService';
import type { FleetAsset } from '../types';

export interface DetectedPersonCoordinate {
  id: string;
  latitude: number;
  longitude: number;
}

export interface OpenRouteMapProps {
  selectedMarker: MarkerType;
  onMarkerSelect: (marker: MarkerType) => void;
  fleetAssets?: FleetAsset[];
  showCenters?: boolean;
  droneCoordinate?: RouteCoordinate;
  roverCoordinate?: RouteCoordinate;
  scanRoute?: RouteCoordinate[];
  detectedPeople?: DetectedPersonCoordinate[];
  focusCoordinate?: RouteCoordinate;
  incidentCoordinate?: RouteCoordinate;
  dronePath?: MapPoint[];
  robotPath?: MapPoint[];
  droneRoute?: RouteCoordinate[];
  robotRoute?: RouteCoordinate[];
  dronePosition?: MapPoint;
  roverPosition?: MapPoint;
}

export declare const OpenRouteMap: React.FC<OpenRouteMapProps>;
