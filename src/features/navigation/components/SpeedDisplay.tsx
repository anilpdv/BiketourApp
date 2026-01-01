import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface SpeedDisplayProps {
  speedKmh: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standalone speed display widget
 * Can be used as a floating overlay on the map
 */
export const SpeedDisplay = memo(function SpeedDisplay({
  speedKmh,
  showIcon = true,
  size = 'md',
}: SpeedDisplayProps) {
  const containerStyle = [
    styles.container,
    size === 'sm' && styles.containerSm,
    size === 'lg' && styles.containerLg,
  ];

  const speedStyle = [
    styles.speed,
    size === 'sm' && styles.speedSm,
    size === 'lg' && styles.speedLg,
  ];

  const unitStyle = [
    styles.unit,
    size === 'sm' && styles.unitSm,
    size === 'lg' && styles.unitLg,
  ];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;

  return (
    <View style={containerStyle}>
      {showIcon && (
        <MaterialCommunityIcons
          name="speedometer"
          size={iconSize}
          color={colors.primary[500]}
          style={styles.icon}
        />
      )}
      <Text style={speedStyle}>{speedKmh.toFixed(1)}</Text>
      <Text style={unitStyle}>km/h</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  containerSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  containerLg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    marginRight: spacing.xs,
    alignSelf: 'center',
  },
  speed: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  speedSm: {
    fontSize: typography.fontSizes.xl,
  },
  speedLg: {
    fontSize: typography.fontSizes['4xl'],
  },
  unit: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
    marginLeft: spacing.xs,
  },
  unitSm: {
    fontSize: typography.fontSizes.sm,
  },
  unitLg: {
    fontSize: typography.fontSizes.lg,
  },
});
