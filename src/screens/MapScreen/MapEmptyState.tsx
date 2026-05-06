import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

export const MapEmptyState: React.FC = () => (
  <View style={styles.container} pointerEvents="none">
    <Text style={styles.text}>
      Toca "+ Ruta" para comenzar a trazar tu recorrido
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    maxWidth: 260,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    lineHeight: 22,
  },
});
