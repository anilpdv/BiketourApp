import React, { memo } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { MapStyleKey } from '../../../shared/config/mapbox.config';
import { MapStyleOption } from '../hooks/useMapSettings';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface MapStylePickerProps {
  visible: boolean;
  currentStyle: MapStyleKey;
  styleOptions: MapStyleOption[];
  onSelectStyle: (style: MapStyleKey) => void;
  onClose: () => void;
}

/**
 * Modal for selecting map style (outdoors, streets, satellite, etc.)
 */
export const MapStylePicker = memo(function MapStylePicker({
  visible,
  currentStyle,
  styleOptions,
  onSelectStyle,
  onClose,
}: MapStylePickerProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>Map Style</Text>
          {styleOptions.map((option) => {
            const isActive = option.key === currentStyle;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => onSelectStyle(option.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                  {option.label}
                </Text>
                {isActive && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minWidth: 220,
    ...shadows['2xl'],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  optionActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  optionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: typography.fontSizes.xl,
    color: colors.neutral[800],
    flex: 1,
  },
  optionLabelActive: {
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  checkmark: {
    fontSize: typography.fontSizes['2xl'],
    color: colors.primary[500],
    fontWeight: typography.fontWeights.bold,
  },
});
