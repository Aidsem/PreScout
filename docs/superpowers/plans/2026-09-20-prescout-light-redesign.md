# PreScout Light-Theme Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution workflow (user-requested):** tests first (superpowers:test-driven-development; `mattpocock-skills:tdd` strictness — each test encodes a spec sentence, implementation does not exceed what tests + brief demand); file edits by a Lich-briefed subagent (`lich-skills:subagent-brief`, ≤200-word dispatch, `general-purpose`); controller re-runs `npx tsc --noEmit && npm run lint && npm test -- --ci` after every task. Manual visual checkpoints after Task 5 and Task 13 — ask the user to look.

**Goal:** Rebrand the app to PreScout and rebuild all eleven screens on a new light "clean ops-console" design system with rich Reanimated/Lottie motion, without changing any context/business logic.

**Architecture:** New token layer (`src/theme/*`) and props-only primitive kit (`src/ui/*`) land first; each screen is then rebuilt on the kit one task at a time, keeping its `useTactical()` calls and navigation contract; legacy `Tactical*` components and dark token aliases are deleted last.

**Tech Stack:** Expo SDK 57, RN 0.86.3, React 19.2.3, TS 6 strict, Jest 29 via `jest-expo`, RNTL. Adds `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`, `lottie-react-native ~7.3.8` (all Expo-57 bundled; `npx expo install`). `react-native-gesture-handler` already present.

**Spec:** `docs/superpowers/specs/2026-09-20-prescout-light-redesign-design.md`

## Global Constraints

- Branch `redesign-prescout-light`, cut from `audit-batch2-persistence-offline` after its Task 3 commit.
- `npx tsc --noEmit` clean under `"strict": true`; no new `any`. `npm run lint` clean.
- Palette exactly as spec §2: `background #FAFAF7`, `surface #FFFFFF`, `surfaceMuted #F1F2F0`, `ink #151A1E`, `inkMuted #5C6670`, `border #E4E7EA`, `accent #E8590C`, `accentContainer #FFF0E6`, `success #2F9E44`, `warning #E67700`, `danger #C92A2A`, `info #0B7285`.
- Fonts: `Courier` only for numbers, IDs, coordinates, eyebrow labels; `System` elsewhere. No font loading.
- Motion: `Durations fast 150 / base 250 / slow 400`, stagger 40 ms; every animated primitive honours `useReducedMotion()`.
- Behaviour preserved: no change to `TacticalContext`, navigation param lists, or `openScreen`. Screens keep calling the same context functions.
- User-visible brand strings: "PreScout" / "PRESCOUT" (never "ResQMesh"). Tagline "Tactical Disaster Response & SAR".
- Style: 2-space indent, single quotes, `React.FC<Props>`.
- Screen tasks additionally run `npx expo export --platform web --output-dir /tmp/prescout-web` and must succeed.
- Commit after each task; message ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (executing model's name is acceptable).

## File Structure

| Path | Responsibility |
|---|---|
| `src/theme/colors.ts` | light palette + temporary legacy aliases |
| `src/theme/typography.ts`, `radii.ts`, `shadows.ts`, `motion.ts`, `status.ts` | tokens; `status.ts` = pure `statusTone()` |
| `src/theme/index.ts` | re-exports |
| `src/ui/<Primitive>.tsx` (+ `__tests__/`) | one primitive per file, props-only |
| `src/hooks/useNetworkStatus.ts`, `src/components/OfflineNotice.tsx` | connectivity (audit Task 5) |
| `assets/lottie/radar.json`, `drone.json`, `pin.json` | in-repo Lottie animations |
| `src/screens/<Name>Screen.tsx` | rebuilt screens; Live Map and Create Incident get subfolders |
| `src/screens/live-map/` | `MissionHud.tsx`, `UnitSheet.tsx`, `useLiveMapSimulation.ts` |
| `src/screens/create-incident/` | `TypeStep.tsx`, `LocationStep.tsx`, `EvidenceStep.tsx`, `ReviewStep.tsx`, `useIncidentForm.ts`, `search.ts` |
| `src/screens/__tests__/<Name>Screen.test.tsx` | one smoke test per screen |

---

### Task 1: Branch, rename, dependencies, theme tokens

**Files:**
- Modify: `app.json`, `package.json`, `jest.setup.js`, `src/theme/colors.ts`
- Create: `src/theme/typography.ts`, `radii.ts`, `shadows.ts`, `motion.ts`, `status.ts`, `index.ts`, `src/theme/__tests__/status.test.ts`, `src/theme/__tests__/motion.test.ts`

**Interfaces (produced):**
```ts
export const Colors: { background; surface; surfaceMuted; ink; inkMuted; border; accent; accentContainer; success; warning; danger; info; white; black; /* legacy aliases */ ... };
export const Fonts = { mono: 'Courier', sans: 'System' }; export const FontSize = { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, display: 36 };
export const Radii = { sm: 8, md: 12, lg: 16, pill: 999 };
export const Shadows = { elevation1: ViewStyle; elevation2: ViewStyle };
export const Durations = { fast: 150, base: 250, slow: 400 }; export const StaggerMs = 40; export const Spring = { damping: 18, stiffness: 180 };
export function useReducedMotion(): boolean;
export function scaleDuration(ms: number, reduced: boolean): number; // reduced ? 0 : ms
export type Tone = { color: string; container: string };
export function statusTone(status: IncidentStatus | AssetStatus): Tone;
```

- [ ] **Step 1: Branch**

```bash
git checkout audit-batch2-persistence-offline && git checkout -b redesign-prescout-light
```

- [ ] **Step 2: Failing tests for `statusTone` and `scaleDuration`**

`src/theme/__tests__/status.test.ts`:
```ts
import { statusTone } from '../status';
import { Colors } from '../colors';

describe('statusTone', () => {
  it.each([
    ['ACTIVE', Colors.danger],
    ['EN ROUTE', Colors.accent],
    ['SEARCH ACTIVE', Colors.info],
    ['CONTAINED', Colors.warning],
    ['RESOLVED', Colors.success],
    ['AVAILABLE', Colors.success],
    ['ON MISSION', Colors.accent],
    ['CHARGING', Colors.warning],
    ['MAINTENANCE', Colors.inkMuted],
  ] as const)('maps %s to the spec colour', (status, color) => {
    expect(statusTone(status).color).toBe(color);
    expect(statusTone(status).container).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
```

`src/theme/__tests__/motion.test.ts`:
```ts
import { scaleDuration, Durations, StaggerMs } from '../motion';

describe('motion tokens', () => {
  it('exposes the spec durations', () => {
    expect(Durations).toEqual({ fast: 150, base: 250, slow: 400 });
    expect(StaggerMs).toBe(40);
  });
  it('zeroes durations when reduced motion is on', () => {
    expect(scaleDuration(250, true)).toBe(0);
    expect(scaleDuration(250, false)).toBe(250);
  });
});
```

Run: `npx jest src/theme` → FAIL (modules missing).

- [ ] **Step 3: Install deps and register mocks**

```bash
npx expo install react-native-reanimated react-native-worklets lottie-react-native
```
Append to `jest.setup.js`:
```js
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props) => React.createElement(View, { testID: props.testID ?? 'lottie' }) };
});
```
No `babel.config.js` is needed — `babel-preset-expo` enables the worklets/reanimated plugin when the packages are installed.

- [ ] **Step 4: Rename**

`app.json`: `"name": "PreScout"`, `"slug": "prescout"`, `"userInterfaceStyle": "light"`, both permission strings → "Allow PreScout to …". `package.json`: `"name": "prescout_app"`.
Run `grep -rn "ResQMesh\|RESQMESH\|resqmesh" src App.tsx README.md` and replace each hit with the same-case PreScout form (`PreScout` / `PRESCOUT` / `prescout`). README title/badges included. The comment on line 1 of `colors.ts` is rewritten in Step 5.

- [ ] **Step 5: Theme tokens**

`src/theme/colors.ts`:
```ts
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
  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases — removed in Task 13 once no screen references them.
  surface_legacy: '#FFFFFF',
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
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#7A2E05',
  error: '#C92A2A',
  errorContainer: '#FCE9E9',
  onError: '#FFFFFF',
  onErrorContainer: '#7A1C1C',
  secondaryContainer: '#FCE9E9',
  secondary: '#C92A2A',
  onWarning: '#FFFFFF',
  onWarningContainer: '#7A3F00',
  accentBlue: '#0B7285',
  accentBlueHover: '#095C6B',
  accentBlueLight: '#E3F4F7',
};

export const Spacing = { unit: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, container: 20, marginMobile: 18, marginDesktop: 32 };
```
(Delete the old `surface_legacy` line if the existing file never had `surface` referenced as dark — keep `surface` = `#FFFFFF` only.)

`typography.ts`:
```ts
export const Fonts = { mono: 'Courier', sans: 'System' } as const;
export const FontSize = { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, display: 36 } as const;
```
`radii.ts`: `export const Radii = { sm: 8, md: 12, lg: 16, pill: 999 } as const;`

`shadows.ts`:
```ts
import { ViewStyle } from 'react-native';
export const Shadows: { elevation1: ViewStyle; elevation2: ViewStyle } = {
  elevation1: { shadowColor: '#151A1E', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  elevation2: { shadowColor: '#151A1E', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
};
```
`motion.ts`:
```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const Durations = { fast: 150, base: 250, slow: 400 } as const;
export const StaggerMs = 40;
export const Spring = { damping: 18, stiffness: 180 } as const;

export function scaleDuration(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}
```
`status.ts`:
```ts
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
```
`index.ts` re-exports all six modules.

- [ ] **Step 6: Verify**

`npx jest src/theme` → PASS. Then `npx tsc --noEmit && npm run lint && npm test -- --ci` → clean (the app still compiles because legacy alias names are kept). `npx expo config --type public | grep -i name` shows PreScout.

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "feat(theme): rebrand to PreScout, light token system, animation deps

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Primitive kit A — Screen, AppBar, Card, Button, StatusPill, SectionHeader, ListRow

**Files:** Create `src/ui/{Screen,AppBar,Card,Button,StatusPill,SectionHeader,ListRow}.tsx`, `src/ui/index.ts`, `src/ui/__tests__/{Button,Card,StatusPill,ListRow}.test.tsx`

**Interfaces (produced):**
```ts
Screen: { children; scroll?: boolean; padded?: boolean; style?: ViewStyle }
AppBar: { title: string; eyebrow?: string; onBack?: () => void; onProfile?: () => void; right?: ReactNode }
Card: { children; pressable?: boolean; onPress?: () => void; style?: ViewStyle; testID?: string }
Button: { label: string; onPress: () => void; variant?: 'primary'|'secondary'|'ghost'|'danger'; loading?: boolean; disabled?: boolean; icon?: keyof typeof MaterialCommunityIcons.glyphMap; fullWidth?: boolean; testID?: string }
StatusPill: { status: IncidentStatus | AssetStatus; small?: boolean }
SectionHeader: { eyebrow?: string; title: string; action?: { label: string; onPress: () => void } }
ListRow: { icon?: glyph; iconColor?: string; title: string; subtitle?: string; trailing?: ReactNode; onPress?: () => void; testID?: string }
```

- [ ] **Step 1: Failing tests**

`src/ui/__tests__/Button.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress with its label visible', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} />);
    fireEvent.press(screen.getByText('Dispatch'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('blocks onPress and shows a spinner while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} loading testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('btn-spinner')).toBeTruthy();
  });
  it('blocks onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```
`StatusPill.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusPill } from '../StatusPill';
import { Colors } from '../../theme';

it('renders the status text in its tone colour', () => {
  render(<StatusPill status="EN ROUTE" />);
  const text = screen.getByText('EN ROUTE');
  expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.accent })]));
});
```
`Card.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Card } from '../Card';

it('renders children and handles press when pressable', () => {
  const onPress = jest.fn();
  render(<Card pressable onPress={onPress} testID="card"><Text>Body</Text></Card>);
  expect(screen.getByText('Body')).toBeTruthy();
  fireEvent.press(screen.getByTestId('card'));
  expect(onPress).toHaveBeenCalled();
});
```
`ListRow.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListRow } from '../ListRow';

it('shows title, subtitle, trailing and handles press', () => {
  const onPress = jest.fn();
  render(<ListRow title="DRONE-01" subtitle="Recon" trailing={<Text>4m</Text>} onPress={onPress} testID="row" />);
  expect(screen.getByText('DRONE-01')).toBeTruthy();
  expect(screen.getByText('Recon')).toBeTruthy();
  expect(screen.getByText('4m')).toBeTruthy();
  fireEvent.press(screen.getByTestId('row'));
  expect(onPress).toHaveBeenCalled();
});
```
Run `npx jest src/ui` → FAIL.

- [ ] **Step 2: Implement**

`Button.tsx` (pattern for all pressables — Reanimated press scale):
```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSize, Radii, Durations, scaleDuration, useReducedMotion } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fullWidth?: boolean;
  testID?: string;
}

const PALETTE: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: Colors.accent, fg: Colors.white, border: Colors.accent },
  secondary: { bg: Colors.surface, fg: Colors.ink, border: Colors.border },
  ghost: { bg: 'transparent', fg: Colors.accent, border: 'transparent' },
  danger: { bg: Colors.danger, fg: Colors.white, border: Colors.danger },
};

export const Button: React.FC<ButtonProps> = ({ label, onPress, variant = 'primary', loading, disabled, icon, fullWidth, testID }) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const blocked = loading || disabled;
  const { bg, fg, border } = PALETTE[variant];
  const press = (to: number) => { scale.value = withTiming(to, { duration: scaleDuration(Durations.fast, reduced) }); };

  return (
    <Animated.View style={[animated, fullWidth && styles.full]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!blocked, busy: !!loading }}
        onPress={() => { if (!blocked) onPress(); }}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={[styles.base, { backgroundColor: bg, borderColor: border }, blocked && styles.blocked] as ViewStyle[]}
      >
        {loading ? (
          <ActivityIndicator testID={testID ? `${testID}-spinner` : 'button-spinner'} color={fg} />
        ) : (
          <>
            {icon ? <MaterialCommunityIcons name={icon} size={18} color={fg} /> : null}
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  base: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, height: 48, borderRadius: Radii.md, borderWidth: 1 },
  blocked: { opacity: 0.55 },
  label: { fontFamily: Fonts.sans, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
```
`Card.tsx`: `View` (or `Pressable` when `pressable`) with `backgroundColor: Colors.surface`, `borderRadius: Radii.lg`, `padding: 16`, `borderWidth: 1`, `borderColor: Colors.border`, `Shadows.elevation1`; when pressable, same Reanimated scale-to-0.98 pattern as `Button` and `Shadows.elevation2` while pressed.
`StatusPill.tsx`: `View` with `statusTone(status).container` background, `Radii.pill`, `paddingHorizontal 10 / vertical 4` (6/2 when `small`); `Text` style array `[styles.text, { color: tone.color }]` with `Fonts.mono`, `FontSize.xs`, `fontWeight '700'`, `letterSpacing 0.8`.
`Screen.tsx`: `SafeAreaView` (from `react-native-safe-area-context`) + `StatusBar barStyle="dark-content"` + background `Colors.background`; `ScrollView` with `contentContainerStyle={{ padding: padded ? 20 : 0, paddingBottom: 40 }}` when `scroll`.
`AppBar.tsx`: row, height 56, `Colors.surface`, bottom hairline; optional back chevron (`chevron-left`), eyebrow (`Fonts.mono`, `FontSize.xs`, `Colors.inkMuted`, uppercase), title (`Fonts.sans`, `FontSize.xl`, `700`, `Colors.ink`), optional profile icon (`account-circle-outline`) or `right` node.
`SectionHeader.tsx`: eyebrow + title (`FontSize.lg`, 700) + optional action `Text` in `Colors.accent`.
`ListRow.tsx`: `Pressable` (or `View` when no `onPress`) row with 44px icon disc (`Colors.surfaceMuted`, icon `iconColor ?? Colors.ink`), title (`FontSize.md`, 600), subtitle (`FontSize.sm`, `Colors.inkMuted`), `trailing` right-aligned; bottom hairline.
`index.ts` exports all seven.

- [ ] **Step 3: Verify + commit**

`npx jest src/ui` → PASS. `npx tsc --noEmit && npm run lint && npm test -- --ci` → clean.
```bash
git add src/ui && git commit -m "feat(ui): core light primitives — Screen, AppBar, Card, Button, StatusPill, SectionHeader, ListRow

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Primitive kit B — motion primitives and Lottie assets

**Files:** Create `src/ui/{Metric,AnimatedCounter,PulseDot,ProgressBar,Skeleton,Stagger,LottieHero,BottomSheet,CollapsibleHeader}.tsx`, `src/ui/__tests__/{AnimatedCounter,Stagger,LottieHero,ProgressBar}.test.tsx`, `assets/lottie/{radar,drone,pin}.json`; modify `src/ui/index.ts`.

**Interfaces (produced):**
```ts
AnimatedCounter: { value: number; format?: (n: number) => string; style?: TextStyle; testID?: string }  // renders formatted value; tweens over Durations.slow
Metric: { label: string; value: number; unit?: string; tone?: string; icon?: glyph }
PulseDot: { color?: string; size?: number }
ProgressBar: { progress: number /* 0..1 */; color?: string; height?: number; testID?: string }
Skeleton: { width?: number | string; height: number; radius?: number }
Stagger: { children: ReactNode; delayMs?: number }  // each child in Animated.View entering={FadeInDown.delay(i * delayMs)}
LottieHero: { source: LottieSource; fallback: ImageSourcePropType; size?: number; loop?: boolean; testID?: string }
BottomSheet: { snapPoints: number[]; initialIndex?: number; children; header?: ReactNode }
CollapsibleHeader: { title: string; eyebrow?: string; scrollY: SharedValue<number>; maxHeight?: number; minHeight?: number; onBack?: () => void; background?: ReactNode }
```

- [ ] **Step 1: Failing tests**

`AnimatedCounter.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AnimatedCounter } from '../AnimatedCounter';

it('renders the target value using the formatter', () => {
  render(<AnimatedCounter value={1234} format={(n) => n.toLocaleString('en-US')} testID="c" />);
  expect(screen.getByTestId('c').props.children).toBe('1,234');
});
```
`Stagger.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Stagger } from '../Stagger';

it('renders every child', () => {
  render(<Stagger><Text>a</Text><Text>b</Text><Text>c</Text></Stagger>);
  expect(screen.getAllByText(/[abc]/)).toHaveLength(3);
});
```
`LottieHero.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LottieHero } from '../LottieHero';

it('renders the lottie view with a fallback prop wired', () => {
  render(<LottieHero source={require('../../../assets/lottie/radar.json')} fallback={require('../../../assets/icon.png')} testID="hero" />);
  expect(screen.getByTestId('hero')).toBeTruthy();
});
```
`ProgressBar.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressBar } from '../ProgressBar';

it('exposes progress for accessibility, clamped to 0..1', () => {
  render(<ProgressBar progress={1.7} testID="p" />);
  expect(screen.getByTestId('p').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
});
```
Run `npx jest src/ui` → FAIL.

- [ ] **Step 2: Lottie assets**

Author three small, valid Lottie JSON files (v 5.7 schema, 60 fps, 90 frames, 240×240): `radar.json` (a rotating 90° wedge with a circle outline), `drone.json` (a quad body with 4 spinning rotor circles), `pin.json` (map pin drop with bounce). Each must load with `JSON.parse` and contain `"v"`, `"fr"`, `"ip"`, `"op"`, `"w"`, `"h"`, `"layers"`. Keep each under 20 KB.

- [ ] **Step 3: Implement**

`AnimatedCounter.tsx`: `useSharedValue(value)`, `useEffect` → `withTiming(value, { duration: scaleDuration(Durations.slow, reduced) })`; `useAnimatedReaction` → `runOnJS(setDisplay)(Math.round(v))`; render `<Text testID style>{format(display)}</Text>`. Under the Jest mock the shared value resolves immediately so the target renders.
`Metric.tsx`: `Card` containing icon disc, `AnimatedCounter` (`Fonts.mono`, `FontSize.xxl`, 700, `tone ?? Colors.ink`), unit suffix, sans label in `Colors.inkMuted`.
`PulseDot.tsx`: `useSharedValue(1)` → `withRepeat(withTiming(1.6, { duration: 900 }), -1, true)` on a halo view behind a solid dot; halo opacity 0.35→0. Reduced motion: static dot.
`ProgressBar.tsx`: track `Colors.surfaceMuted`, fill width animated with `withTiming(clamped * 100 + '%')` via `useAnimatedStyle`; `accessibilityRole="progressbar"` and `accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}`.
`Skeleton.tsx`: `Colors.surfaceMuted` block with a translating highlight (`withRepeat(withTiming(...))`).
`Stagger.tsx`: `React.Children.map(children, (child, i) => <Animated.View entering={FadeInDown.duration(scaleDuration(Durations.base, reduced)).delay(i * delayMs)}>{child}</Animated.View>)`, `delayMs` default `StaggerMs`.
`LottieHero.tsx`: `useState(failed)`; render `LottieView` (`autoPlay`, `loop`, `onAnimationFailure={() => setFailed(true)}`, style size) or `<Image source={fallback} />` when `failed || Platform.OS === 'web' && !lottieWebSupported` — keep simple: try Lottie everywhere, fall back on failure.
`BottomSheet.tsx`: `Animated.View` positioned absolute bottom, height = max snap; translateY shared value; `Gesture.Pan()` from gesture-handler updates translateY, on end snaps to nearest snap point with `withSpring(…, Spring)`; grabber handle + `header` slot + children in a `ScrollView`.
`CollapsibleHeader.tsx`: height interpolates `maxHeight (default 180) → minHeight (default 64)` from `scrollY` `[0, maxHeight - minHeight]` with `interpolate`/`Extrapolation.CLAMP`; `background` node parallaxes (`translateY: scrollY * 0.4`); title font size interpolates 28→18. Consumers pass `scrollY` from `useAnimatedScrollHandler`.

- [ ] **Step 4: Verify + commit**

`npx jest src/ui` → PASS; full gates clean.
```bash
git add src/ui assets/lottie && git commit -m "feat(ui): motion primitives — counters, pulse, progress, skeleton, stagger, Lottie hero, bottom sheet, collapsible header

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: `useNetworkStatus` + `OfflineNotice` (audit Task 5, restyled)

**Files:** Create `src/hooks/useNetworkStatus.ts`, `src/hooks/__tests__/useNetworkStatus.test.ts`, `src/components/OfflineNotice.tsx`, `src/components/__tests__/OfflineNotice.test.tsx`.

**Interfaces (produced):** `isOfflineState({ isConnected, isInternetReachable }): boolean`; `useNetworkStatus(): { isOffline: boolean }`; `OfflineNotice: React.FC<{ message: string }>` (renders `null` online; `testID="offline-notice"`, `accessibilityRole="alert"`).

- [ ] **Step 1: Failing tests** — identical to audit plan Task 5 Step 1 (`isOfflineState` four cases; `OfflineNotice` renders when offline with text `/OFFLINE/` and the message, `null` when online, hook mocked via `jest.mock('../../hooks/useNetworkStatus')`).
- [ ] **Step 2: Implement** — hook identical to audit plan Task 5 Step 3. `OfflineNotice` uses tokens: container `Colors.dangerContainer`, left border 3px `Colors.danger`, icon `wifi-off` in `Colors.danger`, title "OFFLINE" in `Fonts.mono` `FontSize.xs` 700 `Colors.danger`, message in `Fonts.sans` `FontSize.sm` `Colors.ink`; wrapped in `Animated.View entering={FadeInDown}`.
- [ ] **Step 3: Verify + commit** `feat: network status hook and OfflineNotice banner`.

---

### Task 5: Splash + Onboarding (+ hydration gate) — **manual checkpoint**

**Files:** Rewrite `src/screens/SplashScreen.tsx`, `src/screens/OnboardingScreen.tsx`; create `src/screens/__tests__/SplashScreen.test.tsx`, `OnboardingScreen.test.tsx`.

- [ ] **Step 1: Failing tests**

`SplashScreen.test.tsx` — the audit plan Task 4 test verbatim (mock `useTactical` → `{ hydrated }`, fake timers, `Math.random` 0.99, expects `replace('Onboarding')` only when hydrated), plus:
```tsx
it('shows the PreScout wordmark and a Lottie hero', () => {
  renderSplash(true);
  expect(screen.getByText('PRESCOUT')).toBeTruthy();
  expect(screen.getByTestId('splash-hero')).toBeTruthy();
});
```
`OnboardingScreen.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OnboardingScreen } from '../OnboardingScreen';

function renderIt() {
  const replace = jest.fn();
  const navigation = { replace } as unknown as React.ComponentProps<typeof OnboardingScreen>['navigation'];
  render(<OnboardingScreen navigation={navigation} route={{ key: 'Onboarding', name: 'Onboarding' as const, params: undefined }} />);
  return replace;
}

it('renders three slides and enters the app from the last one', () => {
  const replace = renderIt();
  expect(screen.getAllByTestId(/slide-\d/)).toHaveLength(3);
  fireEvent.press(screen.getByText('Skip'));
  expect(replace).toHaveBeenCalledWith('MainTabs');
});
```

- [ ] **Step 2: Implement**

Splash: `Screen` (centered), `LottieHero source=radar.json fallback=assets/splash-icon.png size=200 testID="splash-hero"`, wordmark `Text` "PRESCOUT" (`Fonts.mono`, `FontSize.display`, letterSpacing 6, `Colors.ink`), tagline in `Colors.inkMuted`, `ProgressBar progress={progress/100}` with `Colors.accent`, mono status eyebrow. Effects exactly as the audit plan Task 4 Step 3 (`ready` state; second effect waits for `hydrated`, sets "RESTORING OPERATIONAL RECORD..." while waiting, 600 ms hand-off, cleared on unmount).
Onboarding: `FlatList horizontal pagingEnabled` of 3 slides (`testID="slide-0"`…), each `LottieHero` (radar / drone / pin) + title + body on `Screen`; animated dots (width 8→24 via `useAnimatedStyle` on current index); bottom row: `Button variant="ghost" label="Skip"` and `Button label="Next"` → last slide label "Get started"; both finish with `navigation.replace('MainTabs')`. Copy: 1 "See the whole picture" / "Live fleet, incidents and detections on one map." 2 "Dispatch in one tap" / "Nearest available drone and rover assigned automatically." 3 "Keep the record" / "Every action is logged and survives a restart."

- [ ] **Step 3: Verify, export, commit, checkpoint**

Gates + `npx expo export --platform web --output-dir /tmp/prescout-web`. Commit `feat(screens): PreScout splash and onboarding on the light system`. **Ask the user to run `npx expo start --web` (and Expo Go) and confirm the look before continuing.**

---

### Task 6: Command Center + tab bar + stack transitions

**Files:** Rewrite `src/screens/CommandCenterScreen.tsx`; modify `src/navigation/AppNavigator.tsx`; create `src/screens/__tests__/CommandCenterScreen.test.tsx`.

- [ ] **Step 1: Failing test**
```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TacticalProvider } from '../../context/TacticalContext';
import { memoryStorage } from '../../storage/tacticalStorage';
import { CommandCenterScreen } from '../CommandCenterScreen';

const navigation = { navigate: jest.fn(), getState: () => ({ routeNames: ['CommandTab'] }), getParent: () => undefined } as never;

it('shows the three metrics and the incident list', async () => {
  render(
    <TacticalProvider storage={memoryStorage()} persistDelayMs={0}>
      <CommandCenterScreen navigation={navigation} route={{ key: 'k', name: 'CommandTab' as const, params: undefined }} />
    </TacticalProvider>
  );
  await waitFor(() => expect(screen.getByText('Flood Rescue')).toBeTruthy());
  expect(screen.getByText(/ACTIVE MISSIONS/i)).toBeTruthy();
  expect(screen.getByText(/ONLINE UNITS/i)).toBeTruthy();
  expect(screen.getByText(/ALERTS/i)).toBeTruthy();
  expect(screen.getByTestId('fab-report')).toBeTruthy();
});
```
- [ ] **Step 2: Implement** — `Screen scroll`, `AppBar eyebrow="COMMAND CENTER" title="Good day, Operator" onProfile`, `Stagger` of three `Metric`s (`activeMissionCount`, `onlineAssetCount`, `activeAlertCount`; alerts metric tone `Colors.danger`, pressable → `DetectionDetails`), latest-dispatch `Card` (drone/rover names, `PulseDot`), `SectionHeader title="Incidents" action={{label:'Live map'}}`, incidents as `ListRow` with `StatusPill` trailing, FAB (`Pressable testID="fab-report"`, 56px, `Colors.accent`, `Shadows.elevation2`, icon `plus`) → `openScreen(navigation, 'CreateIncident')`. Navigator: tab bar `Colors.surface` bg, `Colors.border` top hairline, active `Colors.accent`, inactive `Colors.inkMuted`; stack default `animation: 'slide_from_right'`, Splash/Onboarding/MainTabs `'fade'`.
- [ ] **Step 3: Verify, export, commit** `feat(screens): command center on the light system; tab bar and transitions`.

---

### Task 7: Live Map — decomposition + redesign (+ offline notice)

**Files:** Rewrite `src/screens/LiveMapScreen.tsx` (composition only, target < 300 lines); create `src/screens/live-map/{MissionHud,UnitSheet}.tsx`, `src/screens/live-map/useLiveMapSimulation.ts`, `src/screens/live-map/__tests__/useLiveMapSimulation.test.ts`, `src/screens/__tests__/LiveMapScreen.test.tsx`.

- [ ] **Step 1: Read the existing screen once and list the simulation state** (simulating, dronePath/robotPath, droneRoute/robotRoute, droneCoordinate, roverTravel, scanRoute, detectedPeople, bothArrived, focus/incident coordinates, `recordMission` call on completion). That list is the state the hook must own. Write `useLiveMapSimulation.test.ts` against the pure parts:
```ts
import { simulationReducer, initialSimulation } from '../useLiveMapSimulation';

it('starts idle, enters simulating on START, and completes on BOTH_ARRIVED', () => {
  let s = simulationReducer(initialSimulation, { type: 'START' });
  expect(s.simulating).toBe(true);
  s = simulationReducer(s, { type: 'BOTH_ARRIVED' });
  expect(s.bothArrived).toBe(true);
  expect(s.simulating).toBe(false);
});
```
`LiveMapScreen.test.tsx`: renders inside `TacticalProvider` with mocked navigation/route (`params: undefined`), `jest.mock('../../components/OpenRouteMap', () => ({ OpenRouteMap: () => null }))`, asserts `getByText(/GEOSPATIAL/i)` and `getByTestId('mission-hud')`.
- [ ] **Step 2: Implement** — move state machine + timers + `useRouteTravel`/`usePathTravel` orchestration into the hook (`useReducer` + effects; the same effects that exist today, relocated). `MissionHud` = `BottomSheet snapPoints=[96, 320]` with `PulseDot` + status ("FLIGHT SIMULATION" / "UNITS ON SCENE" / "STANDBY"), unit `ListRow`s with ETA in mono, `Button`s for start/reset. `UnitSheet` shows the selected marker's asset. Screen: `AppBar eyebrow="LIVE MAP" title="Geospatial awareness"`, `OfflineNotice message="Map tiles and live routing unavailable. Unit positions and simulated routes still update."`, map canvas, HUD. Map marker colours in `OpenRouteMap.native/.web` → tokens (`Colors.accent` drone, `Colors.info` rover route, `Colors.danger` incident).
- [ ] **Step 3: Verify, export, commit** `feat(screens): live map decomposed onto the light system with offline notice`.

---

### Task 8: Missions

**Files:** Rewrite `src/screens/MissionPlanningScreen.tsx`; create `src/screens/__tests__/MissionPlanningScreen.test.tsx`.

- [ ] **Step 1: Failing test** — render in provider; expect `getByText(/MISSION PARAMETERS/i)`, a `getByTestId('launch-button')`, and pressing it calls through (spy `startFlightSimulation` via a wrapper hook is not possible without mocking; instead assert `navigation.navigate`/`openScreen` was called with `'LiveMap'` and a `missionAssignment` param).
- [ ] **Step 2: Implement** — `Screen scroll`, `AppBar`, `Card` per section: mission type as segmented control (`Pressable` chips, selected = `Colors.accentContainer` bg + `Colors.accent` text), area/altitude/speed as `ProgressBar`-backed steppers (−/+ `Button variant="secondary"`) since `@react-native-community/slider` is not installed — do not add it; unit pickers as selectable `ListRow`s with check icon; AI profile chips; geofence toggle (`Switch` with `trackColor` accent); `Button label="Launch simulation" testID="launch-button" loading` while navigating. Keep all `updateMissionParams`/`startFlightSimulation` calls.
- [ ] **Step 3: Verify, export, commit** `feat(screens): mission planning on the light system`.

---

### Task 9: Assets

**Files:** Rewrite `src/screens/AssetSelectionScreen.tsx`; create `src/screens/__tests__/AssetSelectionScreen.test.tsx`.

- [ ] **Step 1: Failing test** — render in provider; wait for `DRONE-01`; expect incident chips (`getByText('Flood Rescue')`), pressing an AVAILABLE asset's assign button (`getByTestId('assign-drone-03')`) changes its pill to `ON MISSION`.
- [ ] **Step 2: Implement** — `AppBar eyebrow="FLEET" title="Assets"`, horizontal `ScrollView` of incident chips (selected = accent container), summary `Metric` row (available / on mission), two-column grid of pressable `Card`s: name (mono), subtype, `StatusPill small`, battery `ProgressBar` (tone by level: >50 success, >25 warning, else danger), signal icon, `Button` "Assign" / "Release" (`testID` `assign-<id>` / `release-<id>`) calling `assignAsset(asset.id, targetIncident.id)` / `unassignAsset`; on `{ ok: false }` show `Alert.alert('Cannot assign', reason)` (existing behaviour); inline confirmation `Text` fades in via `FadeIn` for 2 s.
- [ ] **Step 3: Verify, export, commit** `feat(screens): asset selection on the light system`.

---

### Task 10: History + Profile

**Files:** Rewrite `src/screens/MissionHistoryScreen.tsx`, `src/screens/ProfileScreen.tsx`; create tests `MissionHistoryScreen.test.tsx`, `ProfileScreen.test.tsx`.

- [ ] **Step 1: Failing tests** — History: render in provider; expect `OP-ALPHA-77`, a `SectionHeader` per month (`getByText(/OCTOBER 2024/i)`), `getByTestId('export-button')`. Profile: render; expect `getByText(/Operator/)` and the app name `PreScout`.
- [ ] **Step 2: Implement** — History: group `missionHistory` by `date.slice(0,7)` via a pure `groupByMonth(items)` helper exported from the screen file (unit-tested in the same test file), `Stagger` of `Card`s (code mono, title, `StatusPill`-like completed/archived chip using `Colors.success`/`Colors.inkMuted`, drones/rovers/duration row), export `Button variant="secondary" icon="export-variant" testID="export-button"` keeping the existing share/export logic, empty state with `pin.json` `LottieHero`. Profile: operator `Card` (avatar disc, name, role), stats `Metric` row (missions, hours), rows for "About PreScout" (version from `expo-constants` is not installed — read `package.json` version via `require('../../package.json').version`), sign-out ghost button (no-op as today).
- [ ] **Step 3: Verify, export, commit** `feat(screens): mission history and profile on the light system`.

---

### Task 11: Create Incident (+ offline search)

**Files:** Rewrite `src/screens/CreateIncidentScreen.tsx` (composition, target < 250 lines); create `src/screens/create-incident/{TypeStep,LocationStep,EvidenceStep,ReviewStep}.tsx`, `useIncidentForm.ts`, `search.ts`, `__tests__/search.test.ts`, `__tests__/useIncidentForm.test.ts`, `src/screens/__tests__/CreateIncidentScreen.test.tsx`.

- [ ] **Step 1: Failing tests** — `search.test.ts`: the audit plan Task 6 tests verbatim (`shouldSearchPlaces`, `OFFLINE_SEARCH_MESSAGE`), plus `it('never searches outside search mode', () => expect(shouldSearchPlaces('Pune', false, 'gps')).toBe(false))` — signature becomes `shouldSearchPlaces(query, isOffline, locationMode)`. `useIncidentForm.test.ts`: `canAdvance(step, form)` pure validation — step 0 needs `type`, step 1 needs coordinates, step 3 needs `title` non-empty. Screen test: render in provider with `useNetworkStatus` mocked offline; expect stepper `getByTestId('step-0')`…`step-3`, and `getByTestId('offline-notice')` after moving to the Location step in search mode.
- [ ] **Step 2: Implement** — `useIncidentForm` owns form state + `canAdvance`; Photon fetch effect moves to `LocationStep` and uses `shouldSearchPlaces(searchQuery, isOffline, locationMode)`, setting `OFFLINE_SEARCH_MESSAGE` as the search error when offline with a ≥3-char query; `OfflineNotice message="Place search needs a connection. GPS capture and manual coordinates still work."` above the search field; GPS capture `Button loading` during `getCurrentPositionAsync`. Stepper header: four dots with animated connector width; steps slide via `Animated.View entering={SlideInRight} exiting={SlideOutLeft}`. `ReviewStep` shows a summary `Card` and `Button label="Dispatch incident"` calling the existing `dispatchIncident` flow and navigation.
- [ ] **Step 3: Verify, export, commit** `feat(screens): create-incident stepper on the light system with offline-aware search`.

---

### Task 12: Live Monitoring + Detection Details

**Files:** Rewrite `src/screens/LiveMonitoringScreen.tsx`, `src/screens/DetectionDetailsScreen.tsx`; tests `LiveMonitoringScreen.test.tsx`, `DetectionDetailsScreen.test.tsx`.

- [ ] **Step 1: Failing tests** — Monitoring: render in provider with `jest.mock('../../components/ThermalDetectionVideo', () => ({ ThermalDetectionVideo: () => null }))`; expect `getByText(/ALTITUDE/i)`, camera toggle `getByTestId('camera-toggle')`, and a detection row `PERSON DETECTED`. Details: render with `route.params = { alertId: 'det-02' }`; expect `FLOOD SURGE HAZARD`, `getByTestId('copy-coordinates')`, `getByTestId('resolve-button')`; render with `params: undefined` must not throw and shows the first alert.
- [ ] **Step 2: Implement** — Monitoring: `CollapsibleHeader` (background = `ThermalDetectionVideo`, eyebrow "LIVE MONITORING"), `Animated.ScrollView` with `useAnimatedScrollHandler` feeding `scrollY`; telemetry strip of four `Metric`s (altitude, speed, battery, signal) with `PulseDot`; camera segmented toggle (`testID="camera-toggle"`) calling `toggleCameraMode`; alerts as `ListRow`s → `DetectionDetails`. Details: `CollapsibleHeader` hero (thermal frame image), confidence `Metric` (unit "%"), severity `StatusPill`-style chip, coordinates in mono with `Button variant="ghost" icon="content-copy" testID="copy-coordinates"` (existing clipboard + `appendLog` behaviour, warning on failure), primary `Button testID="resolve-button"` → `resolveAlert`, secondary "Share" keeping current share/log behaviour; forensic/vault actions kept as ghost buttons.
- [ ] **Step 3: Verify, export, commit** `feat(screens): live monitoring and detection details on the light system`.

---

### Task 13: Cleanup, legacy removal, docs — **manual checkpoint**

**Files:** Delete `src/components/TacticalComponents.tsx`; modify `src/theme/colors.ts` (remove legacy aliases), `src/components/ErrorBoundary.tsx`, `src/components/OpenRouteMap.native.tsx`/`.web.tsx` (any remaining legacy tokens), `README.md`, `AUDIT_BUG_REPORT.md`.

- [ ] **Step 1:** `grep -rn "TacticalComponents\|surfaceContainer\|tertiary\|onSurface\|outlineVariant\|Colors\.error\b\|Colors\.primary\b" src App.tsx` → must be empty after edits; delete the legacy alias block from `colors.ts` and `TacticalComponents.tsx`. `ErrorBoundary` fallback restyled: `Screen`, `MaterialCommunityIcons alert-octagon-outline` in `Colors.danger`, "SYSTEM FAULT" mono title (the existing test asserts this text), message, `Button label="Restart"`. Existing `ErrorBoundary.test.tsx` must still pass.
- [ ] **Step 2: README** — title/badges "PreScout"; screenshots section note "light theme"; replace the Offline section with the accurate table from the audit plan Task 7 Step 1; fix the TOC link and line-71/178 claims as specified there.
- [ ] **Step 3: Audit report appendix** — append the "Remediation status" table from the audit plan Task 7 Step 2, with B08 "Fixed", B09 "Mitigated", B10 "Deferred".
- [ ] **Step 4: Gates** — `npx tsc --noEmit && npm run lint && npm test -- --ci && npx expo export --platform web --output-dir /tmp/prescout-web`; `grep -rn "ResQMesh\|RESQMESH\|resqmesh" --exclude-dir=node_modules --exclude-dir=.git . | grep -v AUDIT_BUG_REPORT.md | grep -v docs/` → empty.
- [ ] **Step 5: Commit** `chore: remove legacy tactical components and dark aliases; docs for PreScout`. **Ask the user for the final visual check on web + Android.**

---

## Verification (end-to-end)

1. `npx tsc --noEmit`, `npm run lint`, `npm test -- --ci` all clean; suites include one per primitive with tests, one smoke test per screen, and the pure helpers.
2. `npx expo export --platform web` succeeds; `npx expo start --web` shows every screen on the light system with animations; Android via Expo Go: Splash Lottie plays, onboarding pages swipe, cards lift on press, map HUD sheet drags, offline banner appears in airplane mode.
3. Persisted state (from audit Task 3) still restores after force-quit; Splash waits on hydration.
4. No "ResQMesh" string remains outside the audit report and historical docs.
