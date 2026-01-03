import React, { memo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  typography,
} from '../../../../shared/design/tokens';

interface FilterToggleSwitchProps {
  label: string;
  icon: string;
  value: boolean | null;
  onToggle: (value: boolean | null) => void;
}

export const FilterToggleSwitch = memo(function FilterToggleSwitch({
  label,
  icon,
  value,
  onToggle,
}: FilterToggleSwitchProps) {
  const isEnabled = value === true;

  const handleToggle = (newValue: boolean) => {
    // If turning off, set to null (no filter)
    onToggle(newValue ? true : null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color={isEnabled ? colors.secondary[600] : colors.neutral[500]}
          style={styles.icon}
        />
        <Text style={[styles.label, isEnabled && styles.labelActive]}>
          {label}
        </Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        trackColor={{
          false: colors.neutral[200],
          true: colors.secondary[200],
        }}
        thumbColor={isEnabled ? colors.secondary[500] : colors.neutral[400]}
        ios_backgroundColor={colors.neutral[200]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.xl,
    color: colors.neutral[700],
  },
  labelActive: {
    color: colors.neutral[800],
    fontWeight: typography.fontWeights.medium,
  },
});

export default FilterToggleSwitch;
