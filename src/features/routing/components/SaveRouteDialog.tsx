import React, { useState, memo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface SaveRouteDialogProps {
  visible: boolean;
  onSave: (name: string, description?: string) => void;
  onCancel: () => void;
  distance: number;
  waypointCount: number;
  initialName?: string;
  initialDescription?: string;
  isEditing?: boolean;
}

/**
 * Dialog for saving a planned route with name and description
 */
export const SaveRouteDialog = memo(function SaveRouteDialog({
  visible,
  onSave,
  onCancel,
  distance,
  waypointCount,
  initialName,
  initialDescription,
  isEditing = false,
}: SaveRouteDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Pre-fill form when dialog opens (with initial values if editing)
  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setDescription(initialDescription || '');
    }
  }, [visible, initialName, initialDescription]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onCancel();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{isEditing ? 'Update Route' : 'Save Route'}</Text>

          <Text style={styles.stats}>
            {waypointCount} waypoints · {formatDistance(distance)}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Route Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter route name"
              placeholderTextColor={colors.neutral[400]}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Add notes about this route"
              placeholderTextColor={colors.neutral[400]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.saveButton,
                !name.trim() && styles.saveButtonDisabled,
                pressed && name.trim() && styles.saveButtonPressed,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={[styles.saveText, !name.trim() && styles.saveTextDisabled]}>
                {isEditing ? 'Update' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  dialog: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    width: '85%',
    maxWidth: 400,
    ...shadows.xl,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stats: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[800],
  },
  multiline: {
    minHeight: 80,
    paddingTop: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  cancelText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  saveButton: {
    backgroundColor: colors.primary[500],
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveButtonPressed: {
    backgroundColor: colors.primary[600],
  },
  saveText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
  saveTextDisabled: {
    color: colors.neutral[400],
  },
});
