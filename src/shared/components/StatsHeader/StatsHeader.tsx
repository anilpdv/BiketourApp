import React, { memo } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../design/tokens';

export interface StatItem {
  value: string | number;
  label: string;
  valueStyle?: TextStyle;
}

export interface StatsHeaderProps {
  stats: StatItem[];
  backgroundColor?: string;
  variant?: 'default' | 'compact';
  style?: ViewStyle;
}

export const StatsHeader = memo(function StatsHeader({
  stats,
  backgroundColor = colors.primary[500],
  variant = 'default',
  style,
}: StatsHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, { backgroundColor }, isCompact && styles.containerCompact, style]}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={[styles.statValue, isCompact && styles.statValueCompact, stat.valueStyle]}>
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, isCompact && styles.statLabelCompact]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.xl,
  },
  containerCompact: {
    padding: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
  statValueCompact: {
    fontSize: typography.fontSizes['2xl'],
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  statLabelCompact: {
    fontSize: typography.fontSizes.xs,
  },
});
