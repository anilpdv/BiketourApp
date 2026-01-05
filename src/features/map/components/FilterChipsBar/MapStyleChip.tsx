import React, { memo, ComponentProps } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MapStyleChipProps {
  label: string;
  icon: IconName;
  isActive: boolean;
  onPress: () => void;
}

/**
 * Chip for selecting map style (Outdoors, Streets, Satellite, etc.)
 * Single-select behavior - only one can be active at a time
 */
export const MapStyleChip = memo(function MapStyleChip({
  label,
  icon,
  isActive,
  onPress,
}: MapStyleChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label} map style${isActive ? ', selected' : ''}`}
    >
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={isActive ? colors.primary[700] : colors.neutral[600]}
        style={styles.icon}
      />
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  labelActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeights.semibold,
  },
});

export default MapStyleChip;
