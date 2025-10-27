// Theme Configuration
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export const COLORS = {
  // Background colors (Facebook-style)
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F3F5', // Facebook light gray
    tertiary: '#E4E6EB', // Facebook input background
  },
  
  // Text colors
  text: {
    primary: '#1C1E21', // Facebook dark text
    secondary: '#65676B', // Facebook secondary text
    tertiary: '#8A8D91', // Facebook muted text
    white: '#FFFFFF',
    gray: '#65676B',
    lightGray: '#E4E6EB',
    darkGray: '#1C1E21',
  },
  
  // Border colors
  border: {
    primary: '#E5E7EB',
    secondary: '#F3F4F6',
  },
  
  // Accent colors (Facebook blue)
  accent: {
    primary: '#1877F2', // Facebook blue
    danger: '#F02849', // Facebook red
  },
  
  // Shadow colors
  shadow: {
    primary: '#000000',
  },
  
  // Additional colors for compatibility
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  darkGray: '#374151',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  error: '#EF4444',
  success: '#10B981',
  warning: '#FBBF24',
  info: '#3B82F6',
  gradientStart: '#6366F1',
  gradientEnd: '#4F46E5',
  secondary: '#F8F9FA',
  cardBackground: '#1F2937',
};

export const RESPONSIVE_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Alias for backward compatibility
export const SPACING = RESPONSIVE_SPACING;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

// Alias for backward compatibility
export const RESPONSIVE_FONT_SIZES = FONT_SIZES;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const SAFE_AREA = {
  top: 44,
  bottom: 34,
};

export const DIMENSIONS = {
  screenWidth: 375,
  screenHeight: 812,
  isLargeDevice: false,
};

// Type-safe style helpers
export const createViewStyle = (style: ViewStyle): ViewStyle => style;
export const createTextStyle = (style: TextStyle): TextStyle => style;
export const createImageStyle = (style: ImageStyle): ImageStyle => style;