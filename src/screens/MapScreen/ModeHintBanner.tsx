import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface Props {
  hint: string;
}

export const ModeHintBanner: React.FC<Props> = ({ hint }) => (
  <View style={styles.banner} pointerEvents="none">
    <Text style={styles.text}>{hint}</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.overlayLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
  text: {
    color: colors.surface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
