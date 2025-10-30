import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, googleLogin, isLoading } = useAuth();

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
      }
    } catch (error: any) {
      const message = error?.message || '';

      // Các lỗi liên quan đến đăng nhập sai, validate...
      if (
        message.includes('Thông tin đăng nhập không hợp lệ') ||
        message.includes('Email hoặc mật khẩu không đúng') ||
        message.includes('Tài khoản không tồn tại')
      ) {
        Alert.alert('Đăng nhập không thành công', 'Sai tài khoản hoặc mật khẩu.');
        return;
      }

      // Lỗi kết nối mạng
      if (message.toLowerCase().includes('kết nối')) {
        Alert.alert('Lỗi kết nối', message);
        return;
      }

      // Lỗi khác (không rõ)
      Alert.alert('Lỗi', message || 'Có lỗi xảy ra khi đăng nhập');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('LoginScreen: Starting Google login...');
      const response = await googleLogin();
      
      console.log('LoginScreen: Google login response:', response);
      
      // Kiểm tra nếu là user mới (cần nhập password)
      if (response.isNewUser) {
        console.log('LoginScreen: New user, navigating to complete registration...');
        
        // Navigate đến màn hình hoàn tất đăng ký với params
        router.push({
          pathname: '/complete-google-registration' as any,
          params: {
            email: response.email || '',
            fullName: response.fullName || '',
            avatarUrl: response.avatarUrl || '',
            googleId: response.googleId || '',
          },
        });
      } else {
        // User đã tồn tại - login thành công
        console.log('LoginScreen: Existing user, login successful');
        Alert.alert(
          'Thành công',
          'Đăng nhập Google thành công!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('LoginScreen: Google login error:', error);
      
      // Không hiển thị error nếu user cancel
      if (error.isCancelled || error.message?.includes('cancelled')) {
        console.log('LoginScreen: User cancelled Google login - no action needed');
        return;
      }
      
      Alert.alert(
        'Lỗi đăng nhập Google',
        error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
      );
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

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.googleButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
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
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    paddingTop: SAFE_AREA.top,
    paddingBottom: SAFE_AREA.bottom + RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    justifyContent: 'center',
    minHeight: DIMENSIONS.screenHeight - SAFE_AREA.top - SAFE_AREA.bottom,
  } as ViewStyle,
  logoContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  logo: {
    width: 100,
    height: 100,
  } as ImageStyle,
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
  } as TextStyle,
  form: {
    width: '100%',
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  } as ViewStyle,
  icon: {
    marginRight: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  } as TextStyle,
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
    boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.2)',
    elevation: 3,
  } as ViewStyle,
  loginButtonText: {
    color: COLORS.text.white,
    fontSize: FONT_SIZES.lg,
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
    color: COLORS.text.gray,
    fontSize: FONT_SIZES.sm,
  } as TextStyle,
  googleButton: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  } as ViewStyle,
  googleButtonText: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  } as TextStyle,
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  signupText: {
    color: COLORS.text.gray,
    fontSize: FONT_SIZES.sm,
  } as TextStyle,
  signupLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  } as TextStyle,
});