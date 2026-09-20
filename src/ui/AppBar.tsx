import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSize } from '../theme';

interface AppBarProps {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  onProfile?: () => void;
  right?: React.ReactNode;
}

export const AppBar: React.FC<AppBarProps> = ({ title, eyebrow, onBack, onProfile, right }) => {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={styles.side}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {right ? (
        <View style={styles.side}>{right}</View>
      ) : onProfile ? (
        <Pressable
          onPress={onProfile}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          style={styles.side}
        >
          <MaterialCommunityIcons name="account-circle-outline" size={26} color={Colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  side: { minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, paddingHorizontal: 4 },
  eyebrow: { fontFamily: Fonts.mono, fontSize: FontSize.xs, color: Colors.inkMuted, letterSpacing: 0.8 },
  title: { fontFamily: Fonts.sans, fontSize: FontSize.xl, fontWeight: '700', color: Colors.ink },
});
