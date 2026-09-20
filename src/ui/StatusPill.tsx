import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts, FontSize, Radii, statusTone } from '../theme';
import { AssetStatus, IncidentStatus } from '../types';

interface StatusPillProps {
  status: IncidentStatus | AssetStatus;
  small?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, small }) => {
  const tone = statusTone(status);
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tone.container },
        small ? styles.small : styles.regular,
      ]}
    >
      <Text style={[styles.text, { color: tone.color }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: Radii.pill, alignSelf: 'flex-start' },
  regular: { paddingHorizontal: 10, paddingVertical: 4 },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontFamily: Fonts.mono, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.8 },
});
