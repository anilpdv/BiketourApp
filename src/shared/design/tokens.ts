/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the app
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Primary brand colors (Blue - used for active states, links, primary actions)
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196F3', // Main primary
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },

  // Secondary colors (Green - success, cycling theme)
  secondary: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4CAF50', // Main secondary
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },

  // Neutral colors (Grays)
  neutral: {
    0: '#ffffff',
    50: '#f5f5f5',
    100: '#f0f0f0',
    200: '#e0e0e0',
    300: '#cccccc',
    400: '#999999',
    500: '#888888',
    600: '#666666',
    700: '#555555',
    800: '#333333',
    900: '#1a1a1a',
  },

  // Status colors
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    errorLight: '#ff5252',
    info: '#2196F3',
  },

  // Feature-specific colors
  feature: {
    terrain: '#8B4513', // Saddle Brown
    terrainLight: '#fef3e2',
    buildings: '#6B5B95', // Purple
    buildingsLight: '#f0eef5',
    mapStyle: '#4A90D9',
  },

  // Elevation colors
  elevation: {
    gain: '#4CAF50',
    loss: '#f44336',
  },

  // Overlay colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },

  // POI category colors
  poi: {
    campsite: '#228B22', // Forest Green
    drinking_water: '#1E90FF', // Dodger Blue
    bike_shop: '#FF6347', // Tomato
    bike_repair: '#FF8C00', // Dark Orange
    hotel: '#9370DB', // Medium Purple
    hostel: '#20B2AA', // Light Sea Green
    guest_house: '#DEB887', // Burlywood
    shelter: '#8B4513', // Saddle Brown
    supermarket: '#32CD32', // Lime Green
    restaurant: '#DC143C', // Crimson
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontSizes: {
    xs: 10,
    sm: 11,
    md: 12,
    base: 13,
    lg: 14,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 24,
    '5xl': 28,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// =============================================================================
// SIZES
// =============================================================================

export const sizes = {
  // Icon button sizes
  iconButton: {
    sm: 32,
    md: 44,
    lg: 56,
  },
  // Chip heights
  chip: {
    sm: 28,
    md: 36,
    lg: 44,
  },
  // Touch targets (minimum)
  touchTarget: 44,
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1,
  sticky: 10,
  overlay: 50,
  modal: 100,
  tooltip: 150,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorScale = typeof colors;
export type SpacingScale = typeof spacing;
export type TypographyScale = typeof typography;
export type ShadowScale = typeof shadows;
export type BorderRadiusScale = typeof borderRadius;
export type SizeScale = typeof sizes;
