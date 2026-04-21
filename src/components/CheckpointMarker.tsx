import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Checkpoint } from '../models';

interface Props {
  checkpoint: Checkpoint;
}

export const CheckpointMarker: React.FC<Props> = ({ checkpoint }) => (
  <Marker coordinate={checkpoint.coordinate} anchor={{ x: 0.5, y: 1 }}>
    <View style={styles.marker}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.label} numberOfLines={1}>
        {checkpoint.label}
      </Text>
    </View>
  </Marker>
);

const styles = StyleSheet.create({
  marker: { alignItems: 'center', maxWidth: 80 },
  icon: { fontSize: 24 },
  label: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    overflow: 'hidden',
  },
});
