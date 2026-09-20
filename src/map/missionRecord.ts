import type { IncidentType, MissionHistoryItem } from '../types';

const CALLWORDS = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'];

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function missionTypeFor(incidentType: IncidentType | undefined): MissionHistoryItem['type'] {
  switch (incidentType) {
    case 'missing':
    case 'sar':
      return 'Search & Rescue';
    case 'medical':
      return 'Medical Emergency';
    case 'fire':
    case 'flood':
    case 'landslide':
      return 'Containment';
    default:
      return 'Recon';
  }
}

function formatCoordinates(coordinates: { lat: number; lng: number }): string {
  const lat = `${Math.abs(coordinates.lat).toFixed(4)}°${coordinates.lat < 0 ? 'S' : 'N'}`;
  const lng = `${Math.abs(coordinates.lng).toFixed(4)}°${coordinates.lng < 0 ? 'W' : 'E'}`;
  return `${lat}, ${lng}`;
}

export interface MissionRecordInput {
  sequence: number;
  title: string;
  incidentType: IncidentType | undefined;
  location: string;
  coordinates: { lat: number; lng: number };
  droneCount: number;
  roverCount: number;
  startedAt: number;
  endedAt: number;
  status: MissionHistoryItem['status'];
}

export function buildMissionRecord(input: MissionRecordInput): Omit<MissionHistoryItem, 'id'> {
  const started = new Date(input.startedAt);
  const elapsed = input.endedAt - input.startedAt;
  const callword = CALLWORDS[(input.sequence - 1) % CALLWORDS.length];
  // Simulated: roughly 2.4 GB of telemetry per unit-hour, never reported as zero.
  const unitHours = ((input.droneCount + input.roverCount) * elapsed) / 3600_000;
  const telemetryGb = Math.max(0.1, unitHours * 2.4);
  return {
    code: `OP-${callword}-${String(input.sequence).padStart(2, '0')}`,
    title: input.title,
    type: missionTypeFor(input.incidentType),
    date: started.toISOString().slice(0, 10),
    time: `${started.toISOString().slice(11, 19)} UTC`,
    location: input.location,
    coordinates: formatCoordinates(input.coordinates),
    status: input.status,
    dronesCount: input.droneCount,
    roversCount: input.roverCount,
    duration: formatDuration(elapsed),
    telemetrySize: `${telemetryGb.toFixed(1)} GB Telemetry`,
  };
}
