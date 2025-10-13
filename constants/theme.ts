import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const COLORS = {
  // Nexora Brand Colors
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Secondary Colors
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',
  
  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
  gray: '#64748B',
  darkGray: '#334155',
  black: '#0F172A',
  
  // Background Colors
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  
  // Border & Divider
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Gradient Colors
  gradientStart: '#6366F1',
  gradientEnd: '#EC4899',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// Responsive dimensions
export const DIMENSIONS = {
  screenWidth,
  screenHeight,
  isSmallDevice: screenWidth < 375,
  isMediumDevice: screenWidth >= 375 && screenWidth < 414,
  isLargeDevice: screenWidth >= 414,
  isTablet: screenWidth >= 768,
};

// Safe area helpers
export const SAFE_AREA = {
  top: Platform.OS === 'ios' ? 44 : 24,
  bottom: Platform.OS === 'ios' ? 34 : 0,
  horizontal: Platform.OS === 'ios' ? 20 : 16,
};

// Responsive spacing based on screen size
export const RESPONSIVE_SPACING = {
  xs: DIMENSIONS.isSmallDevice ? 2 : 4,
  sm: DIMENSIONS.isSmallDevice ? 4 : 8,
  md: DIMENSIONS.isSmallDevice ? 8 : DIMENSIONS.isLargeDevice ? 20 : 16,
  lg: DIMENSIONS.isSmallDevice ? 12 : DIMENSIONS.isLargeDevice ? 28 : 24,
  xl: DIMENSIONS.isSmallDevice ? 16 : DIMENSIONS.isLargeDevice ? 36 : 32,
  xxl: DIMENSIONS.isSmallDevice ? 20 : DIMENSIONS.isLargeDevice ? 44 : 40,
};

// Responsive font sizes
export const RESPONSIVE_FONT_SIZES = {
  xs: DIMENSIONS.isSmallDevice ? 10 : 12,
  sm: DIMENSIONS.isSmallDevice ? 12 : 14,
  md: DIMENSIONS.isSmallDevice ? 14 : DIMENSIONS.isLargeDevice ? 18 : 16,
  lg: DIMENSIONS.isSmallDevice ? 16 : DIMENSIONS.isLargeDevice ? 20 : 18,
  xl: DIMENSIONS.isSmallDevice ? 20 : DIMENSIONS.isLargeDevice ? 28 : 24,
  xxl: DIMENSIONS.isSmallDevice ? 24 : DIMENSIONS.isLargeDevice ? 36 : 32,
};
