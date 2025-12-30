import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../shared/design/tokens';

export const widgetStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    ...shadows.md,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weatherIcon: {
    fontSize: 20,
  },
  temperature: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  detailRow: {
    marginTop: 2,
  },
  detailText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  scoreRow: {
    marginTop: spacing.xs,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  scoreText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[0],
  },
  errorText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[400],
  },
});

export const detailStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  closeButton: {
    fontSize: typography.fontSizes.lg,
    color: colors.primary[500],
  },
  currentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bigIcon: {
    fontSize: 48,
    marginRight: spacing.lg,
  },
  currentInfo: {
    flex: 1,
  },
  bigTemp: {
    fontSize: 36,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  feelsLike: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing.lg,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[400],
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
  },
  forecastTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  forecastList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  dayIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  dayTemp: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  dayScore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayScoreText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[0],
  },
});
