import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../shared/design/tokens';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  sheetContent: {
    // No flex - let content determine height naturally (bounded by sheet minHeight/maxHeight)
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
  },
  contentContainer: {
    // No flex: 1 - it breaks sheet sizing
  },
  scrollContent: {
    paddingBottom: 100,  // Large padding to ensure buttons are visible when scrolling
  },
  sectionPadding: {
    paddingHorizontal: spacing.lg,
  },
});

// Hero photo with overlay header
export const heroStyles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  noPhotoContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoIcon: {
    marginBottom: spacing.xs,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing['3xl'],
  },
  photoCount: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoCountText: {
    color: colors.neutral[0],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});

// Header styles (for overlay on hero or standalone)
export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  overlayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  nameOverlay: {
    color: colors.neutral[0],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  category: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[500],
  },
  categoryOverlay: {
    color: 'rgba(255,255,255,0.9)',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});

// Thumbnail gallery
export const thumbnailStyles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    gap: spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[200],
  },
  thumbnailActive: {
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
});

// Info section styles
export const infoStyles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  label: {
    color: colors.neutral[500],
    fontSize: typography.fontSizes.lg,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  value: {
    color: colors.neutral[800],
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'right',
    flexShrink: 1,
  },
  copyButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
});

// Action buttons
export const actionsStyles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: borderRadius.xl,
  },
  primaryButtonContent: {
    height: 52,
  },
  primaryButtonLabel: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2xl'],
    marginTop: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
});

// Notes section
export const notesStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#fffbe6',
    borderRadius: borderRadius.lg,
  },
  label: {
    color: '#8b6914',
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeights.medium,
  },
  input: {
    backgroundColor: colors.neutral[0],
  },
});

// Description section
export const descriptionStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
  },
  text: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral[600],
    lineHeight: 20,
  },
});

// Amenities section
export const amenitiesStyles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[800],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  chipYes: {
    backgroundColor: colors.secondary[50],
  },
  chipNo: {
    backgroundColor: colors.neutral[100],
  },
  chipLimited: {
    backgroundColor: colors.status.warning + '20',
  },
  chipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  chipTextYes: {
    color: colors.secondary[700],
  },
  chipTextNo: {
    color: colors.neutral[500],
  },
  chipTextLimited: {
    color: colors.status.warning,
  },
});

// Loading state
export const loadingStyles = StyleSheet.create({
  container: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
});
