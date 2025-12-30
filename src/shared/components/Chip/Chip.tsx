import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Chip as PaperChip, Badge, useTheme } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../design/tokens';

export interface ChipProps {
  label: string;
  icon?: React.ReactNode | (() => React.ReactNode);
  selected?: boolean;
  color?: string;
  count?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Chip({
  label,
  icon,
  selected = false,
  color,
  count,
  onPress,
  disabled = false,
  style,
}: ChipProps) {
  const theme = useTheme();

  // Determine colors based on selection state
  const selectedColor = color || colors.primary[500];
  const backgroundColor = selected ? `${selectedColor}15` : colors.neutral[0];
  const textColor = selected ? selectedColor : colors.neutral[600];

  // Handle icon rendering for Paper
  const renderIcon = icon
    ? typeof icon === 'function'
      ? icon
      : () => icon
    : undefined;

  return (
    <View style={[styles.wrapper, style]}>
      <PaperChip
        mode={selected ? 'flat' : 'outlined'}
        selected={selected}
        onPress={onPress}
        disabled={disabled}
        icon={renderIcon}
        textStyle={{ color: textColor, fontWeight: selected ? '600' : '500' }}
        style={[
          styles.chip,
          {
            backgroundColor,
            borderColor: selected ? selectedColor : colors.neutral[200],
          },
        ]}
        selectedColor={selectedColor}
        showSelectedCheck={false}
        elevated={!selected}
        elevation={selected ? 0 : 1}
      >
        {label}
      </PaperChip>
      {count !== undefined && count > 0 && (
        <Badge
          size={18}
          style={[
            styles.badge,
            { backgroundColor: color || colors.primary[500] },
          ]}
        >
          {count}
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  chip: {
    borderWidth: 2,
    borderRadius: borderRadius['2xl'],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
  },
});

export default Chip;
