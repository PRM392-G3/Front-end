import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        Alert.alert('Thành công', 'Đăng nhập thành công!');
        // Navigation sẽ được xử lý bởi AuthGuard
      } else {
        Alert.alert('Lỗi', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đăng nhập');
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
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.title}>Chào mừng trở lại</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email hoặc số điện thoại"
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                ) : (
                  <Eye size={DIMENSIONS.isLargeDevice ? 24 : 20} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Chưa có tài khoản? </Text>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SAFE_AREA.top,
    paddingBottom: SAFE_AREA.bottom + RESPONSIVE_SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    justifyContent: 'center',
    minHeight: DIMENSIONS.screenHeight - SAFE_AREA.top - SAFE_AREA.bottom,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xxl,
  },
  logo: {
    width: DIMENSIONS.isLargeDevice ? 120 : 100,
    height: DIMENSIONS.isLargeDevice ? 120 : 100,
  },
  title: {
    fontSize: RESPONSIVE_FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  subtitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xxl,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
    height: DIMENSIONS.isLargeDevice ? 60 : 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  icon: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: DIMENSIONS.isLargeDevice ? 60 : 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
    boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.2)',
    elevation: 3,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.lg,
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
    fontSize: RESPONSIVE_FONT_SIZES.sm,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    height: DIMENSIONS.isLargeDevice ? 60 : 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  googleButtonText: {
    color: COLORS.black,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.gray,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
  },
});