/**
 * React Native Paper Theme Configuration
 * Maps existing design tokens to Paper's Material Design 3 theme
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';
import { colors, spacing, borderRadius, typography } from './tokens';

// iOS-optimized font configuration using system fonts
const fontConfig = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

// Configure fonts with iOS system font for native feel
const fonts = configureFonts({
  config: {
    displayLarge: {
      ...fontConfig,
      fontSize: 57,
      fontWeight: '400',
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    displayMedium: {
      ...fontConfig,
      fontSize: 45,
      fontWeight: '400',
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      ...fontConfig,
      fontSize: 36,
      fontWeight: '400',
      lineHeight: 44,
      letterSpacing: 0,
    },
    headlineLarge: {
      ...fontConfig,
      fontSize: typography.fontSizes['5xl'], // 28
      fontWeight: '400',
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      ...fontConfig,
      fontSize: typography.fontSizes['4xl'], // 24
      fontWeight: '400',
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      ...fontConfig,
      fontSize: typography.fontSizes['3xl'], // 20
      fontWeight: '400',
      lineHeight: 32,
      letterSpacing: 0,
    },
    titleLarge: {
      ...fontConfig,
      fontSize: typography.fontSizes['2xl'], // 18
      fontWeight: '500',
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      ...fontConfig,
      fontSize: typography.fontSizes.xl, // 16
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      ...fontConfig,
      fontSize: typography.fontSizes.lg, // 14
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    bodyLarge: {
      ...fontConfig,
      fontSize: typography.fontSizes.xl, // 16
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      ...fontConfig,
      fontSize: typography.fontSizes.lg, // 14
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      ...fontConfig,
      fontSize: typography.fontSizes.md, // 12
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelLarge: {
      ...fontConfig,
      fontSize: typography.fontSizes.lg, // 14
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      ...fontConfig,
      fontSize: typography.fontSizes.md, // 12
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      ...fontConfig,
      fontSize: typography.fontSizes.sm, // 11
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
});

// Light theme - iOS-native aesthetic with system colors
export const paperLightTheme = {
  ...MD3LightTheme,
  fonts,
  roundness: borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors (Blue - iOS system blue inspired)
    primary: colors.primary[500],
    onPrimary: colors.neutral[0],
    primaryContainer: colors.primary[50],
    onPrimaryContainer: colors.primary[900],

    // Secondary colors (Green - cycling theme)
    secondary: colors.secondary[500],
    onSecondary: colors.neutral[0],
    secondaryContainer: colors.secondary[50],
    onSecondaryContainer: colors.secondary[900],

    // Tertiary (Purple - for accents like journal)
    tertiary: '#7E57C2',
    onTertiary: colors.neutral[0],
    tertiaryContainer: '#EDE7F6',
    onTertiaryContainer: '#4A148C',

    // Surface and background
    surface: colors.neutral[0],
    onSurface: colors.neutral[900],
    surfaceVariant: colors.neutral[50],
    onSurfaceVariant: colors.neutral[600],
    surfaceDisabled: colors.neutral[100],
    onSurfaceDisabled: colors.neutral[400],

    // Background
    background: colors.neutral[50],
    onBackground: colors.neutral[900],

    // Error states
    error: colors.status.error,
    onError: colors.neutral[0],
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',

    // Outline and borders
    outline: colors.neutral[300],
    outlineVariant: colors.neutral[200],

    // Inverse colors
    inverseSurface: colors.neutral[800],
    inverseOnSurface: colors.neutral[50],
    inversePrimary: colors.primary[200],

    // Shadow
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],

    // Elevation surfaces (iOS subtle shadows)
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[0],
      level2: colors.neutral[0],
      level3: colors.neutral[50],
      level4: colors.neutral[50],
      level5: colors.neutral[100],
    },
  },
};

// Dark theme for future dark mode support
export const paperDarkTheme = {
  ...MD3DarkTheme,
  fonts,
  roundness: borderRadius.md,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: colors.primary[300],
    onPrimary: colors.primary[900],
    primaryContainer: colors.primary[700],
    onPrimaryContainer: colors.primary[100],

    // Secondary colors
    secondary: colors.secondary[300],
    onSecondary: colors.secondary[900],
    secondaryContainer: colors.secondary[700],
    onSecondaryContainer: colors.secondary[100],

    // Tertiary
    tertiary: '#B39DDB',
    onTertiary: '#4A148C',
    tertiaryContainer: '#5E35B1',
    onTertiaryContainer: '#EDE7F6',

    // Surface and background
    surface: colors.neutral[900],
    onSurface: colors.neutral[50],
    surfaceVariant: colors.neutral[800],
    onSurfaceVariant: colors.neutral[300],
    surfaceDisabled: colors.neutral[800],
    onSurfaceDisabled: colors.neutral[500],

    // Background
    background: colors.neutral[900],
    onBackground: colors.neutral[50],

    // Error states
    error: colors.status.errorLight,
    onError: colors.neutral[900],
    errorContainer: '#B71C1C',
    onErrorContainer: '#FFCDD2',

    // Outline and borders
    outline: colors.neutral[500],
    outlineVariant: colors.neutral[700],

    // Inverse
    inverseSurface: colors.neutral[100],
    inverseOnSurface: colors.neutral[800],
    inversePrimary: colors.primary[600],

    // Shadow
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],

    // Elevation surfaces
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[800],
      level2: colors.neutral[800],
      level3: colors.neutral[700],
      level4: colors.neutral[700],
      level5: colors.neutral[600],
    },
  },
};

// Export design token mappings for easy reference in components
export const paperSpacing = spacing;
export const paperBorderRadius = borderRadius;

// Custom component defaults for iOS-native feel
export const componentDefaults = {
  button: {
    roundness: borderRadius.md,
    contentStyle: { paddingVertical: spacing.xs },
  },
  card: {
    roundness: borderRadius.lg,
  },
  chip: {
    roundness: borderRadius.full,
  },
  fab: {
    roundness: borderRadius.lg,
  },
  textInput: {
    roundness: borderRadius.md,
  },
};

// Type exports
export type PaperTheme = typeof paperLightTheme;
