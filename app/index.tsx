import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, clearAuthData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      console.log('IndexScreen: Checking auth status...');
      console.log('isLoading:', isLoading);
      console.log('isAuthenticated:', isAuthenticated);
      
      // Redirect ngay lập tức dựa trên trạng thái authentication
      if (!isLoading) {
        if (isAuthenticated) {
          console.log('IndexScreen: Redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          console.log('IndexScreen: Redirecting to login');
          router.replace('/auth/login');
        }
      }
    };

    checkAndRedirect();
  }, [isAuthenticated, isLoading, router]);

  // Hiển thị debug screen trong development
  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Debug Screen</Text>
        <Text style={styles.status}>
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.status}>
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}
        </Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            await AsyncStorage.clear();
            Alert.alert('Cleared', 'All data cleared');
          }}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Production: hiển thị splash screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  status: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
