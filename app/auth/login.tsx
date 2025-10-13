import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

    const success = await login(email.trim(), password);
    
    if (success) {
      Alert.alert('Thành công', 'Đăng nhập thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng');
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
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingTop: 80,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  form: {
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
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
    color: COLORS.black,
  },
  forgotPassword: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'right',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    color: COLORS.gray,
    fontSize: FONT_SIZES.sm,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  googleButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.gray,
  },
  googleButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  googleButtonTextDisabled: {
    color: COLORS.gray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.darkGray,
    fontSize: FONT_SIZES.sm,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
