import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export interface NavigationOverlayProps {
  routeName: string | null;
  formattedSpeed: string;
  currentSpeedKmh: number;
  formattedDistanceRemaining: string;
  formattedDistanceTraveled: string;
  progressPercent: number;
  formattedTimeRemaining: string;
  isOffRoute: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

/**
 * Navigation overlay showing speed, distance, and progress
 */
export const NavigationOverlay = memo(function NavigationOverlay({
  routeName,
  formattedSpeed,
  currentSpeedKmh,
  formattedDistanceRemaining,
  formattedDistanceTraveled,
  progressPercent,
  formattedTimeRemaining,
  isOffRoute,
  isPaused,
  onPause,
  onResume,
  onStop,
}: NavigationOverlayProps) {
  return (
    <View style={styles.container}>
      {/* Off-route warning */}
      {isOffRoute && (
        <View style={styles.offRouteWarning}>
          <MaterialCommunityIcons name="alert" size={18} color={colors.neutral[0]} />
          <Text style={styles.offRouteText}>You are off route</Text>
        </View>
      )}

      {/* Route name */}
      {routeName && (
        <Text style={styles.routeName} numberOfLines={1}>
          {routeName}
        </Text>
      )}

      {/* Speed display */}
      <View style={styles.speedSection}>
        <MaterialCommunityIcons
          name="bike"
          size={28}
          color={isPaused ? colors.neutral[400] : colors.secondary[500]}
        />
        <Text style={[styles.speedValue, isPaused && styles.textMuted]}>
          {formattedSpeed}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, progressPercent)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent.toFixed(0)}%</Text>
      </View>

      {/* Distance and time stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>{formattedDistanceRemaining}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Traveled</Text>
          <Text style={styles.statValue}>{formattedDistanceTraveled}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>ETA</Text>
          <Text style={styles.statValue}>{formattedTimeRemaining}</Text>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        {isPaused ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.resumeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onResume}
          >
            <MaterialCommunityIcons name="play" size={20} color={colors.neutral[0]} />
            <Text style={styles.buttonTextLight}>Resume</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.pauseButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onPause}
          >
            <MaterialCommunityIcons name="pause" size={20} color={colors.neutral[700]} />
            <Text style={styles.buttonTextDark}>Pause</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.stopButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onStop}
        >
          <MaterialCommunityIcons name="stop" size={20} color={colors.neutral[0]} />
          <Text style={styles.buttonTextLight}>End</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.neutral[0],
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.xl,
  },
  offRouteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  offRouteText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  routeName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  speedValue: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  textMuted: {
    color: colors.neutral[400],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[600],
    minWidth: 40,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  pauseButton: {
    backgroundColor: colors.neutral[100],
  },
  resumeButton: {
    backgroundColor: colors.secondary[500],
  },
  stopButton: {
    backgroundColor: colors.status.error,
  },
  buttonTextLight: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
  buttonTextDark: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
});
