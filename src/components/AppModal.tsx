import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
}

export const AppModal: React.FC<Props> = ({ visible, onRequestClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
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
