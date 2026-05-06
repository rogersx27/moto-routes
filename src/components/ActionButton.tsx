import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

type ActionVariant = 'primary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ActionVariant;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export const ActionButton: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style,
}) => (
  <TouchableOpacity
    style={[styles.base, variant === 'primary' ? styles.primary : styles.danger, style]}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
  >
    <Text style={[styles.text, variant === 'danger' && styles.dangerText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    marginHorizontal: spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  danger: {},
  text: {
    color: colors.surface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
  dangerText: {
    color: colors.danger,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
