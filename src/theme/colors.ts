// PreScout visual system: paper surfaces, ink text, one safety-orange accent.
export const Colors = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F2F0',
  ink: '#151A1E',
  inkMuted: '#5C6670',
  border: '#E4E7EA',
  accent: '#E8590C',
  accentContainer: '#FFF0E6',
  success: '#2F9E44',
  successContainer: '#E6F6E9',
  warning: '#E67700',
  warningContainer: '#FFF3E0',
  danger: '#C92A2A',
  dangerContainer: '#FCE9E9',
  info: '#0B7285',
  infoContainer: '#E3F4F7',
  onAccent: '#FFFFFF', // text/icons on accent or danger fills
  black: '#000000',

  // Legacy aliases — removed in Task 13 once no screen references them.
  // `white` meant "high-contrast text" in the old dark screens, not the
  // literal colour white — on light paper that text must stay dark ink.
  white: '#151A1E',
  surfaceDim: '#F1F2F0',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FAFAF7',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#F1F2F0',
  surfaceContainerHighest: '#E4E7EA',
  surfaceVariant: '#E4E7EA',
  primary: '#151A1E',
  primaryFixed: '#151A1E',
  primaryFixedDim: '#5C6670',
  primaryContainer: '#F1F2F0',
  onPrimary: '#FFFFFF',
  onSurface: '#151A1E',
  onSurfaceVariant: '#5C6670',
  onBackground: '#151A1E',
  outline: '#5C6670',
  outlineVariant: '#E4E7EA',
  tertiary: '#E8590C',
  tertiaryFixed: '#E8590C',
  tertiaryFixedDim: '#C94D0A',
  tertiaryContainer: '#FFF0E6',
  onTertiary: '#7A2E05',
  onTertiaryContainer: '#7A2E05',
  error: '#C92A2A',
  errorContainer: '#FCE9E9',
  onError: '#7A1C1C',
  onErrorContainer: '#7A1C1C',
  secondaryContainer: '#FCE9E9',
  secondary: '#C92A2A',
  onWarning: '#7A3F00',
  onWarningContainer: '#7A3F00',
  accentBlue: '#0B7285',
  accentBlueHover: '#095C6B',
  accentBlueLight: '#E3F4F7',
};

export const Spacing = { unit: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, container: 20, marginMobile: 18, marginDesktop: 32 };

// Distinct map-marker palette — kept separate from the legacy aliases above so
// markers never collapse onto the same colour again.
export const MapColors = {
  drone: '#E8590C', // accent orange
  rover: '#0B7285', // teal
  droneRoute: '#E8590C',
  roverRoute: '#0B7285',
  fireStation: '#8B1E1E', // deep red — distinct from `incident` red so the two markers never collide
  policeStation: '#3B5BDB', // indigo
  hospital: '#2F9E44', // green
  person: '#9C36B5', // purple — detections
  hazard: '#E67700', // amber
  incident: '#C92A2A',
  markerBg: '#FFFFFF',
  labelBg: 'rgba(255, 255, 255, 0.92)',
  labelText: '#151A1E',
  canvas: '#FAFAF7',
};
