import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ForceAuthClear = () => {
  const [isClearing, setIsClearing] = useState(false);

  const forceClearAuth = async () => {
    setIsClearing(true);
    try {
      // Xóa tất cả auth data
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
      
      // Xóa tất cả data khác có thể liên quan
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('user') ||
        key.includes('google')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
      
      Alert.alert('Thành công', 'Đã xóa tất cả dữ liệu authentication');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      Alert.alert('Lỗi', 'Không thể xóa dữ liệu authentication');
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceClear = () => {
    Alert.alert(
      'Force Clear Auth Data',
      'Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu authentication?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: forceClearAuth
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Force Clear Auth Data</Text>
      <Text style={styles.subtitle}>
        Sử dụng khi app vẫn vào trang home mà chưa đăng nhập
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isClearing && styles.buttonDisabled]} 
        onPress={handleForceClear}
        disabled={isClearing}
      >
        <Text style={styles.buttonText}>
          {isClearing ? 'Đang xóa...' : 'Force Clear All Auth Data'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.warning}>
        ⚠️ Sau khi xóa, app sẽ redirect về trang đăng nhập
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  warning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
    textAlign: 'center',
  },
});
