import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

type PillVariant = 'default' | 'gps' | 'save' | 'stop';

interface Props {
  label: string;
  onPress: () => void;
  active?: boolean;
  variant?: PillVariant;
  accessibilityLabel?: string;
}

const variantStyle: Record<PillVariant, object> = {
  default: { backgroundColor: colors.textPrimary },
  gps: { backgroundColor: colors.info },
  save: { backgroundColor: colors.success },
  stop: { backgroundColor: colors.danger },
};

export const PillButton: React.FC<Props> = ({
  label,
  onPress,
  active = false,
  variant = 'default',
  accessibilityLabel,
}) => (
  <TouchableOpacity
    style={[styles.btn, variantStyle[variant], active && styles.active]}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  active: { backgroundColor: colors.primary },
  text: {
    color: colors.surface,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },
});
