import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  children: React.ReactNode;
}

export const AppModal: React.FC<Props> = ({ visible, children }) => (
  <Modal visible={visible} transparent animationType="slide">
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  </Modal>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
