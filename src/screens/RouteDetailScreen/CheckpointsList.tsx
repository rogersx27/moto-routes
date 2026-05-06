import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Checkpoint } from '../../models';
import { colors, typography, spacing, radius } from '../../theme';

interface Props {
  checkpoints: Checkpoint[];
}

export const CheckpointsList: React.FC<Props> = ({ checkpoints }) => {
  if (checkpoints.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>Checkpoints ({checkpoints.length})</Text>
      {checkpoints.map((cp) => (
        <View key={cp.id} style={styles.listItem}>
          <Text style={styles.itemLabel}>📍 {cp.label}</Text>
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
