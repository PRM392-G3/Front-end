import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';

export const SplashScreen = () => {
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Sparkles size={48} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>Nexora</Text>
          <Text style={styles.logoSubtext}>Social Platform</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 200,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: FONT_SIZES.xxl * 1.5,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  logoSubtext: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: SPACING.md,
  },
});
