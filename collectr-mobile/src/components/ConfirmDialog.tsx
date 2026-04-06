import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#f43f5e',
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.dialogContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.dialog}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: confirmColor }]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 340,
  },
  dialog: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
