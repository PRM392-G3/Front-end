import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={COLORS.gray} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
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
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color={COLORS.gray} />
              ) : (
                <Eye size={20} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxText}>
              Tôi đồng ý với{' '}
              <Text style={styles.link}>Điều khoản dịch vụ</Text>
              {' '}và{' '}
              <Text style={styles.link}>Chính sách bảo mật</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleButtonText}>Đăng ký với Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity>
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
  } as ViewStyle,
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
  registerButtonText: {
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
  googleButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
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
