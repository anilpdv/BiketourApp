import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../shared/design/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.6,
    minHeight: SCREEN_HEIGHT * 0.35,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
});

export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: typography.fontSizes.xl,
    color: colors.neutral[600],
  },
});

export const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.neutral[600],
    flex: 1,
  },
  value: {
    color: colors.neutral[800],
    fontWeight: typography.fontWeights.medium,
    flex: 2,
    textAlign: 'right',
  },
});

export const actionsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  navigateButton: {
    // Paper Button handles contained mode styling
  },
});

export const notesStyles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#fffbe6', // Light amber for notes section
    borderRadius: borderRadius.md,
  },
  label: {
    color: '#8b6914', // Amber text color
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.neutral[0],
  },
});

export const descriptionStyles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  text: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[700],
    lineHeight: 20,
  },
});
