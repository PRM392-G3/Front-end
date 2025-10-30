import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      const success = await login(email.trim(), password);
      if (success) {
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
      // Không else ở đây! Vì nếu login trả về false là bất thường, còn lại exception sẽ bị catch phía dưới.
    } catch (error: any) {
      const message = error?.message || '';
      if (
        message.includes('Thông tin đăng nhập không hợp lệ') ||
        message.includes('Email hoặc mật khẩu không đúng') ||
        message.includes('Tài khoản không tồn tại')
      ) {
        Alert.alert('Đăng nhập không thành công', 'Sai tài khoản hoặc mật khẩu.');
        return;
      }
      if (message.toLowerCase().includes('kết nối')) {
        Alert.alert('Lỗi kết nối', message);
        return;
      }
      Alert.alert('Lỗi', message || 'Có lỗi xảy ra khi đăng nhập');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await googleLogin();
    
    if (success) {
      Alert.alert('Thành công', 'Đăng nhập Google thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('Lỗi', 'Đăng nhập Google thất bại');
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email hoặc số điện thoại"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
              {showPassword ? (
                <EyeOff size={20} color={COLORS.gray} />
              ) : (
                <Eye size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            disabled={isLoading} 
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>
              Đăng nhập với Google
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
            <Text style={styles.footerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingTop: 80,
  } as ViewStyle,
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    marginBottom: RESPONSIVE_SPACING.xl,
  } as TextStyle,
  form: {
    marginBottom: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
    height: 56,
  } as ViewStyle,
  icon: {
    marginRight: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  } as TextStyle,
  forgotPassword: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'right',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as TextStyle,
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  loginButtonDisabled: {
    backgroundColor: COLORS.gray,
  } as ViewStyle,
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  } as TextStyle,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.primary,
  } as ViewStyle,
  dividerText: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    color: COLORS.gray,
    fontSize: FONT_SIZES.sm,
  } as TextStyle,
  googleButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  googleButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.gray,
  } as ViewStyle,
  googleButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  } as TextStyle,
  googleButtonTextDisabled: {
    color: COLORS.gray,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  footerText: {
    color: COLORS.darkGray,
    fontSize: FONT_SIZES.sm,
  } as TextStyle,
  footerLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  } as TextStyle,
});
