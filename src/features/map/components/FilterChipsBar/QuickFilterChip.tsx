import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../../shared/design/tokens';

interface QuickFilterChipProps {
  label: string;
  isActive: boolean;
  icon?: string;
  count?: number;
  onPress: () => void;
}

export const QuickFilterChip = memo(function QuickFilterChip({
  label,
  isActive,
  icon,
  count,
  onPress,
}: QuickFilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label} filter${count !== undefined ? `, ${count} POIs` : ''}${isActive ? ', selected' : ''}`}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={isActive ? colors.secondary[700] : colors.neutral[600]}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
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
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[400],
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  labelActive: {
    color: colors.secondary[700],
  },
  countBadge: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  countText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
});

export default QuickFilterChip;
