import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AppModal } from './AppModal';
import { colors, typography, spacing, radius } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}

export const InputModal: React.FC<Props> = ({
  visible,
  title,
  placeholder,
  value,
  onChange,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  confirmDisabled = false,
}) => (
  <AppModal visible={visible}>
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Text style={styles.title}>{title}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          autoFocus
        />
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={[styles.confirm, confirmDisabled && styles.confirmDisabled]}>
              {confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  box: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: typography.size.base + 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: spacing.lg,
  },
  cancel: { color: colors.textMuted, fontSize: typography.size.base + 1 },
  confirm: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base + 1,
  },
  confirmDisabled: { color: colors.border },
});
