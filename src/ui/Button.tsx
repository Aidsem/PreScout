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
  primary: { bg: Colors.accent, fg: Colors.onAccent, border: Colors.accent },
  secondary: { bg: Colors.surface, fg: Colors.ink, border: Colors.border },
  ghost: { bg: 'transparent', fg: Colors.accent, border: 'transparent' },
  danger: { bg: Colors.danger, fg: Colors.onAccent, border: Colors.danger },
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
