/**
 * Theme - Common style combinations using design tokens
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius, sizes } from './tokens';

/**
 * Common text styles
 */
export const textStyles = StyleSheet.create({
  // Headings
  h1: {
    fontSize: typography.fontSizes['5xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    lineHeight: typography.fontSizes['5xl'] * typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    lineHeight: typography.fontSizes['4xl'] * typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    lineHeight: typography.fontSizes['2xl'] * typography.lineHeights.tight,
  },
  h4: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[800],
    lineHeight: typography.fontSizes.xl * typography.lineHeights.tight,
  },

  // Body text
  body: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.normal,
    color: colors.neutral[600],
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },
  bodySmall: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.normal,
    color: colors.neutral[600],
    lineHeight: typography.fontSizes.md * typography.lineHeights.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.normal,
    color: colors.neutral[600],
    lineHeight: typography.fontSizes.xl * typography.lineHeights.normal,
  },

  // Labels
  label: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  labelSmall: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
  },

  // Caption
  caption: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.neutral[400],
  },
});

/**
 * Common container styles
 */
export const containerStyles = StyleSheet.create({
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },

  // Card container
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  cardSmall: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },

  // Modal container
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    minWidth: 220,
    ...shadows['2xl'],
  },

  // Absolute positioning helpers
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

/**
 * Common button styles
 */
export const buttonStyles = StyleSheet.create({
  // Base button
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: sizes.touchTarget,
  },

  // Icon button
  iconButton: {
    width: sizes.iconButton.md,
    height: sizes.iconButton.md,
    borderRadius: sizes.iconButton.md / 2,
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  iconButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },

  // Chip/pill button
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  chipSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
    borderWidth: 3,
  },
});

/**
 * Common layout styles
 */
export const layoutStyles = StyleSheet.create({
  // Flex layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing
  gap4: { gap: spacing.xs },
  gap8: { gap: spacing.sm },
  gap12: { gap: spacing.md },
  gap16: { gap: spacing.lg },
  gap24: { gap: spacing['2xl'] },
});

/**
 * Map-specific styles
 */
export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    right: spacing.sm,
    gap: spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay.light,
  },
  errorBanner: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.status.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.neutral[0],
    textAlign: 'center',
  },
});
