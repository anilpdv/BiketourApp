import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../../../shared/design/tokens';

interface SubmitBarProps {
  isValid: boolean;
  isLoading: boolean;
  amount: string;
  currencySymbol: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function SubmitBar({
  isValid,
  isLoading,
  amount,
  currencySymbol,
  onSubmit,
  onCancel,
}: SubmitBarProps) {
  const displayAmount = amount || '0';

  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitButton,
          !isValid && styles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!isValid || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={isValid ? '#fff' : colors.neutral[400]}
            />
            <Text
              style={[styles.submitText, !isValid && styles.submitTextDisabled]}
            >
              Add {currencySymbol}{displayAmount}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing.md,
    ...shadows.md,
  },
  cancelButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    ...shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  submitTextDisabled: {
    color: colors.neutral[400],
  },
});
