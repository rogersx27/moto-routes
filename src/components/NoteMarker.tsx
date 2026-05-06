import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

import type { Note } from '../models';
import { colors, typography, spacing } from '../theme';

interface Props {
  note: Note;
}

export const NoteMarker: React.FC<Props> = ({ note }) => (
  <Marker coordinate={note.coordinate} anchor={{ x: 0.5, y: 1 }}>
    <View style={styles.marker}>
      <Text style={styles.icon}>📝</Text>
    </View>
    <Callout>
      <View style={styles.callout}>
        <Text style={styles.calloutText}>{note.text}</Text>
      </View>
    </Callout>
  </Marker>
);

const styles = StyleSheet.create({
  marker: { alignItems: 'center' },
  icon: { fontSize: 24 },
  callout: {
    maxWidth: 200,
    padding: spacing.sm,
  },
  calloutText: { fontSize: typography.size.sm, color: colors.textPrimary },
});
