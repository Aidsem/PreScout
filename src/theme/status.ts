import { AssetStatus, IncidentStatus } from '../types';
import { Colors } from './colors';

export type Tone = { color: string; container: string };

const TONES: Record<IncidentStatus | AssetStatus, Tone> = {
  ACTIVE: { color: Colors.danger, container: Colors.dangerContainer },
  'EN ROUTE': { color: Colors.accent, container: Colors.accentContainer },
  'SEARCH ACTIVE': { color: Colors.info, container: Colors.infoContainer },
  CONTAINED: { color: Colors.warning, container: Colors.warningContainer },
  RESOLVED: { color: Colors.success, container: Colors.successContainer },
  AVAILABLE: { color: Colors.success, container: Colors.successContainer },
  'ON MISSION': { color: Colors.accent, container: Colors.accentContainer },
  CHARGING: { color: Colors.warning, container: Colors.warningContainer },
  MAINTENANCE: { color: Colors.inkMuted, container: Colors.surfaceMuted },
};

export function statusTone(status: IncidentStatus | AssetStatus): Tone {
  return TONES[status];
}
