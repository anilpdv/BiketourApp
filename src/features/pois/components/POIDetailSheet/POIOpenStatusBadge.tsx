import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { parseOpeningHours, OpeningHoursResult } from '../../utils/openingHoursParser';
import { colors, spacing, borderRadius, typography } from '../../../../shared/design/tokens';

interface POIOpenStatusBadgeProps {
  openingHours?: string;
  showNextChange?: boolean;
  compact?: boolean;
}

/**
 * Badge showing open/closed status based on OSM opening_hours
 */
export const POIOpenStatusBadge = memo(function POIOpenStatusBadge({
  openingHours,
  showNextChange = false,
  compact = false,
}: POIOpenStatusBadgeProps) {
  const result = useMemo(() => parseOpeningHours(openingHours), [openingHours]);

  if (!result) return null;

  const isOpen = result.isOpen;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
        <MaterialCommunityIcons
          name={isOpen ? 'clock-check-outline' : 'clock-outline'}
          size={compact ? 12 : 14}
          color={isOpen ? colors.status.success : colors.status.error}
        />
        <Text style={[styles.text, isOpen ? styles.textOpen : styles.textClosed, compact && styles.textCompact]}>
          {isOpen ? 'Open' : 'Closed'}
        </Text>
      </View>
      {showNextChange && result.nextChange && (
        <Text style={styles.nextChange}>{result.nextChange}</Text>
      )}
    </View>
  );
});

/**
 * Inline status text for use in quick info bar
 */
export const POIOpenStatusInline = memo(function POIOpenStatusInline({
  openingHours,
}: {
  openingHours?: string;
}) {
  const result = useMemo(() => parseOpeningHours(openingHours), [openingHours]);

  if (!result) return null;

  return (
    <View style={stylesInline.container}>
      <View style={[stylesInline.dot, result.isOpen ? stylesInline.dotOpen : stylesInline.dotClosed]} />
      <Text style={stylesInline.text}>
        {result.isOpen ? 'Open today' : 'Closed'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  badgeOpen: {
    backgroundColor: colors.status.success + '15',
  },
  badgeClosed: {
    backgroundColor: colors.status.error + '15',
  },
  text: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  textCompact: {
    fontSize: typography.fontSizes.xs,
  },
  textOpen: {
    color: colors.status.success,
  },
  textClosed: {
    color: colors.status.error,
  },
  nextChange: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
});

const stylesInline = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOpen: {
    backgroundColor: colors.status.success,
  },
  dotClosed: {
    backgroundColor: colors.status.error,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
});
