import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'danger';
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
}

export const AlertDialog: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmLabel = 'Aceptar',
  confirmVariant = 'default',
  onConfirm,
  cancelLabel = 'Cancelar',
  onCancel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel ?? onConfirm}
  >
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={[styles.actions, !onCancel && styles.actionsSingle]}>
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              style={styles.button}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onConfirm}
            style={styles.button}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[
              styles.confirmText,
              confirmVariant === 'danger' && styles.confirmDanger,
            ]}>
              {confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  actionsSingle: {
    justifyContent: 'center',
  },
  button: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: typography.size.base,
    color: colors.textMuted,
  },
  confirmText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  confirmDanger: {
    color: colors.danger,
  },
});
