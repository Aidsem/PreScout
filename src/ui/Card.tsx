import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Durations, Radii, Shadows, scaleDuration, useReducedMotion } from '../theme';

interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, pressable, onPress, style, testID }) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const press = (to: number) => { scale.value = withTiming(to, { duration: scaleDuration(Durations.fast, reduced) }); };

  if (!pressable) {
    return <View testID={testID} style={[styles.base, Shadows.elevation1, style]}>{children}</View>;
  }

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => { setPressed(true); press(0.98); }}
        onPressOut={() => { setPressed(false); press(1); }}
        style={[styles.base, pressed ? Shadows.elevation2 : Shadows.elevation1]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, borderWidth: 1, borderColor: Colors.border },
});
