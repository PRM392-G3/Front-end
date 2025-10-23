import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { register, googleLogin, isLoading } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Lỗi', 'Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    const success = await register(formData);
    
    if (success) {
      Alert.alert('Thành công', 'Đăng ký thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
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

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tạo tài khoản mới</Text>
        <Text style={styles.subtitle}>Đăng ký để bắt đầu kết nối</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor={COLORS.gray}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
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
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
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

          <View style={styles.inputContainer}>
            <Lock size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
              {showConfirmPassword ? (
                <EyeOff size={20} color={COLORS.gray} />
              ) : (
                <Eye size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]} 
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              disabled={isLoading}
            >
              {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              Tôi đồng ý với{' '}
              <Text style={styles.link}>Điều khoản dịch vụ</Text>
              {' '}và{' '}
              <Text style={styles.link}>Chính sách bảo mật</Text>
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            disabled={isLoading} 
            onPress={handleGoogleLogin}
          >
            <Text style={styles.googleButtonText}>
              Đăng ký với Google
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  } as ViewStyle,
  content: {
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.xl,
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
    marginBottom: RESPONSIVE_SPACING.lg,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: RESPONSIVE_SPACING.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  } as ViewStyle,
  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  } as TextStyle,
  checkboxText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    lineHeight: 20,
  } as TextStyle,
  link: {
    color: COLORS.primary,
    fontWeight: '500',
  } as TextStyle,
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  registerButtonDisabled: {
    backgroundColor: COLORS.gray,
  } as ViewStyle,
  registerButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  } as TextStyle,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.primary,
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
    borderColor: COLORS.border.primary,
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
    paddingVertical: RESPONSIVE_SPACING.md,
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
