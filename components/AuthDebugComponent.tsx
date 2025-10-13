import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export const AuthDebugComponent = () => {
  const { user, isAuthenticated, clearAuthData, logout } = useAuth();

  const handleClearAuth = () => {
    Alert.alert(
      'Clear Auth Data',
      'Bạn có chắc chắn muốn xóa tất cả dữ liệu authentication?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            await clearAuthData();
            Alert.alert('Thành công', 'Đã xóa dữ liệu authentication');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug</Text>
      
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Status: {isAuthenticated ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}
        </Text>
        {user && (
          <>
            <Text style={styles.infoText}>User: {user.fullName}</Text>
            <Text style={styles.infoText}>Email: {user.email}</Text>
          </>
        )}
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleClearAuth}>
          <Text style={styles.buttonText}>Clear Auth Data</Text>
        </TouchableOpacity>
        
        {isAuthenticated && (
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  info: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  buttons: {
    gap: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
