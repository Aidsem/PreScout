import { buildMissionRecord, formatDuration, missionTypeFor } from '../missionRecord';

const start = Date.UTC(2026, 8, 20, 8, 15, 0);

describe('formatDuration', () => {
  it('formats as HH:MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(65_000)).toBe('00:01:05');
    expect(formatDuration(4 * 3600_000 + 22 * 60_000 + 15_000)).toBe('04:22:15');
  });
});

describe('missionTypeFor', () => {
  it('maps incident types onto the history categories', () => {
    expect(missionTypeFor('missing')).toBe('Search & Rescue');
    expect(missionTypeFor('sar')).toBe('Search & Rescue');
    expect(missionTypeFor('medical')).toBe('Medical Emergency');
    expect(missionTypeFor('flood')).toBe('Containment');
    expect(missionTypeFor('fire')).toBe('Containment');
    expect(missionTypeFor('landslide')).toBe('Containment');
  });

  it('falls back to Recon when there is no incident', () => {
    expect(missionTypeFor(undefined)).toBe('Recon');
  });
});

describe('buildMissionRecord', () => {
  it('builds a completed record from a real operation', () => {
    const record = buildMissionRecord({
      sequence: 5,
      title: 'Flood Rescue',
      incidentType: 'flood',
      location: 'Pune, Maharashtra',
      coordinates: { lat: 18.5204, lng: 73.8567 },
      droneCount: 1,
      roverCount: 1,
      startedAt: start,
      endedAt: start + 12 * 60_000,
      status: 'COMPLETED',
    });
    expect(record.code).toMatch(/^OP-[A-Z]+-05$/);
    expect(record.title).toBe('Flood Rescue');
    expect(record.type).toBe('Containment');
    expect(record.date).toBe('2026-09-20');
    expect(record.time).toBe('08:15:00 UTC');
    expect(record.location).toBe('Pune, Maharashtra');
    expect(record.coordinates).toBe('18.5204°N, 73.8567°E');
    expect(record.status).toBe('COMPLETED');
    expect(record.dronesCount).toBe(1);
    expect(record.roversCount).toBe(1);
    expect(record.duration).toBe('00:12:00');
    expect(record.telemetrySize).toMatch(/GB Telemetry$/);
  });

  it('formats southern and western coordinates with the right hemisphere letters', () => {
    const record = buildMissionRecord({
      sequence: 1,
      title: 'x',
      incidentType: undefined,
      location: 'x',
      coordinates: { lat: -33.8688, lng: -70.6693 },
      droneCount: 0,
      roverCount: 0,
      startedAt: start,
      endedAt: start,
      status: 'ABORTED',
    });
    expect(record.coordinates).toBe('33.8688°S, 70.6693°W');
    expect(record.status).toBe('ABORTED');
  });
});
