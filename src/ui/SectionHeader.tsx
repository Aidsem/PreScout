import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontSize } from '../theme';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  action?: { label: string; onPress: () => void };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ eyebrow, title, action }) => {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titles: { flex: 1 },
  eyebrow: { fontFamily: Fonts.mono, fontSize: FontSize.xs, color: Colors.inkMuted, letterSpacing: 0.8 },
  title: { fontFamily: Fonts.sans, fontSize: FontSize.lg, fontWeight: '700', color: Colors.ink },
  action: { fontFamily: Fonts.sans, fontSize: FontSize.sm, fontWeight: '600', color: Colors.accent },
});
