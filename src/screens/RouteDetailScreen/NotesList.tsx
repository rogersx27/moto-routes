import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Note } from '../../models';
import { colors, typography, spacing, radius } from '../../theme';

interface Props {
  notes: Note[];
}

export const NotesList: React.FC<Props> = ({ notes }) => {
  if (notes.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>Notas ({notes.length})</Text>
      {notes.map((note) => (
        <View key={note.id} style={styles.listItem}>
          <Text style={styles.itemLabel}>📝 {note.text}</Text>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#333',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  itemLabel: { fontSize: typography.size.base, color: colors.textPrimary },
});
