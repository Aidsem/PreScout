import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSize } from '../theme';

interface ListRowProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}

export const ListRow: React.FC<ListRowProps> = ({ icon, iconColor, title, subtitle, trailing, onPress, testID }) => {
  const content = (
    <>
      {icon ? (
        <View style={styles.iconDisc}>
          <MaterialCommunityIcons name={icon} size={22} color={iconColor ?? Colors.ink} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={styles.row}>
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={styles.row}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  iconDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  title: { fontFamily: Fonts.sans, fontSize: FontSize.md, fontWeight: '600', color: Colors.ink },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSize.sm, color: Colors.inkMuted, marginTop: 2 },
  trailing: { marginLeft: 12, alignItems: 'flex-end' },
});
