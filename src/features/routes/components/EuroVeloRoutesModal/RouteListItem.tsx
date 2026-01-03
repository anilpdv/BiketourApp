import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Switch } from 'react-native-paper';
import { colors, spacing, typography } from '../../../../shared/design/tokens';

interface RouteListItemProps {
  euroVeloId: number;
  name: string;
  color: string;
  distance: string;
  countries: number;
  isEnabled: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

export const RouteListItem = memo(function RouteListItem({
  euroVeloId,
  name,
  color,
  distance,
  countries,
  isEnabled,
  isLoading,
  onToggle,
}: RouteListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        isEnabled && styles.enabled,
      ]}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isEnabled }}
      accessibilityLabel={`EuroVelo ${euroVeloId}, ${name}, ${isEnabled ? 'enabled' : 'disabled'}`}
    >
      <View style={styles.leftContent}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <View style={styles.textContent}>
          <Text style={styles.routeId}>EV{euroVeloId}</Text>
          <Text style={styles.routeName} numberOfLines={1}>{name}</Text>
          <Text style={styles.metadata}>
            {distance} • {countries} {countries === 1 ? 'country' : 'countries'}
          </Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Switch
            value={isEnabled}
            onValueChange={onToggle}
            color={color}
          />
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  pressed: {
    backgroundColor: colors.neutral[50],
  },
  enabled: {
    backgroundColor: colors.primary[50],
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  routeId: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  routeName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: 2,
  },
  metadata: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  rightContent: {
    marginLeft: spacing.md,
    minWidth: 50,
    alignItems: 'flex-end',
  },
});
