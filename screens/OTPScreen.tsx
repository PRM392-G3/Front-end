import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useState, useRef } from 'react';

export default function OTPScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Nhập mã xác thực gồm 6 chữ số đã được gửi đến{'\n'}
          <Text style={styles.phone}>+84 987 654 321</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        <TouchableOpacity>
          <Text style={styles.resendText}>
            Không nhận được mã? <Text style={styles.resendLink}>Gửi lại</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Xác nhận</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.changeNumber}>Thay đổi số điện thoại</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
    lineHeight: 24,
  },
  phone: {
    fontWeight: '600',
    color: COLORS.black,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RESPONSIVE_SPACING.lg,
    gap: RESPONSIVE_SPACING.sm,
  },
  otpInput: {
    width: 52,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.black,
  },
  otpInputFilled: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  changeNumber: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
