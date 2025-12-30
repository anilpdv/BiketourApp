import React, { memo } from 'react';
import { View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { colors, spacing } from '../../design/tokens';

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
  const theme = useTheme();
  const isCompact = variant === 'compact';

  return (
    <Surface
      style={[
        styles.container,
        { backgroundColor },
        isCompact && styles.containerCompact,
        style,
      ]}
      elevation={2}
    >
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text
            variant={isCompact ? 'titleLarge' : 'headlineSmall'}
            style={[styles.statValue, stat.valueStyle]}
          >
            {stat.value}
          </Text>
          <Text
            variant={isCompact ? 'labelSmall' : 'labelMedium'}
            style={styles.statLabel}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.xl,
    borderRadius: 0,
  },
  containerCompact: {
    padding: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    color: colors.neutral[0],
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
});

export default StatsHeader;
