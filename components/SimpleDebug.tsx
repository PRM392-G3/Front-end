import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SimpleDebug = () => {
  const checkAuthData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const user = await AsyncStorage.getItem('user_data');
      
      Alert.alert(
        'Auth Data Check',
        `Token: ${token ? 'EXISTS' : 'NOT EXISTS'}\nUser: ${user ? 'EXISTS' : 'NOT EXISTS'}`,
        [
          { text: 'OK' },
          { 
            text: 'Clear All', 
            onPress: async () => {
              await AsyncStorage.clear();
              Alert.alert('Cleared', 'All data cleared');
            }
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Cannot check auth data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Simple Debug</Text>
      <Text style={styles.subtitle}>Kiểm tra auth data và clear cache</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkAuthData}>
        <Text style={styles.buttonText}>Check Auth Data</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.clearButton]} 
        onPress={async () => {
          await AsyncStorage.clear();
          Alert.alert('Cleared', 'All AsyncStorage cleared');
        }}
      >
        <Text style={styles.buttonText}>Clear All Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
