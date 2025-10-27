import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function CompleteGoogleRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { completeGoogleRegistration } = useAuth();

  const email = params.email as string;
  const fullName = params.fullName as string;
  const avatarUrl = params.avatarUrl as string;
  const googleId = params.googleId as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = () => {
    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleCompleteRegistration = async () => {
    if (!validatePassword()) {
      return;
    }

    console.log('=== Complete Registration Data ===');
    console.log('Email:', email);
    console.log('GoogleId:', googleId);
    console.log('FullName:', fullName);
    console.log('AvatarUrl:', avatarUrl);
    console.log('Password length:', password.length);

    setIsLoading(true);

    try {
      const success = await completeGoogleRegistration({
        email,
        googleId,
        password,
        fullName,
        avatarUrl,
      });

      if (success) {
        Alert.alert('Thành công', 'Đăng ký hoàn tất! Chào mừng đến với Nexora.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể hoàn tất đăng ký. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Complete registration error:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{fullName?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>Hoàn tất đăng ký</Text>
          <Text style={styles.subtitle}>Thiết lập mật khẩu để bảo vệ tài khoản</Text>

          {/* User Info */}
          <View style={styles.userCard}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>

          {/* Password Input */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Lock size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
                {showPassword ? (
                  <EyeOff size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                ) : (
                  <Eye size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
                {showConfirmPassword ? (
                  <EyeOff size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                ) : (
                  <Eye size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleCompleteRegistration}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Hoàn tất đăng ký</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                Alert.alert(
                  'Xác nhận',
                  'Bạn có chắc muốn hủy?',
                  [
                    { text: 'Ở lại', style: 'cancel' },
                    { 
                      text: 'Hủy đăng ký', 
                      style: 'destructive',
                      onPress: () => router.replace('/auth/login')
                    }
                  ]
                );
              }} 
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SAFE_AREA.top,
    paddingBottom: SAFE_AREA.bottom + RESPONSIVE_SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingTop: RESPONSIVE_SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  userCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
    height: 56,
  },
  icon: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
  },
  cancelButtonText: {
    color: COLORS.text.gray,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
