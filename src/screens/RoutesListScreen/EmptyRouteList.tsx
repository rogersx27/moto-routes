import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export const EmptyRouteList: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.icon}>🏍️</Text>
    <Text style={styles.title}>Aún no tienes rutas</Text>
    <Text style={styles.subtitle}>
      Toca el botón + para crear tu primera ruta
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  icon: { fontSize: 56, marginBottom: spacing.lg },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
