import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface Props {
  name: string;
  formattedDate: string;
  km: number;
  description: string;
  onRenamePress: () => void;
}

export const RouteDetailHeader: React.FC<Props> = ({
  name,
  formattedDate,
  km,
  description,
  onRenamePress,
}) => (
  <>
    <TouchableOpacity
      style={styles.titleRow}
      onPress={onRenamePress}
      accessibilityLabel="Renombrar ruta"
    >
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.editIcon}>✏️</Text>
    </TouchableOpacity>

    <Text style={styles.date}>{formattedDate}</Text>

    {km > 0 && (
      <Text style={styles.distance}>{km.toFixed(2)} km recorridos</Text>
    )}

    {description ? (
      <Text style={styles.description}>{description}</Text>
    ) : null}
  </>
);

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  editIcon: { fontSize: 18 },
  date: {
    fontSize: typography.size.sm,
    color: '#888',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  distance: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  description: {
    fontSize: typography.size.base,
    color: '#444',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
