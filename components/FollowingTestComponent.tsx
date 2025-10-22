import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testUser9Following } from '../utils/followingTest';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';

const FollowingTestComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const testResult = await testUser9Following();
      setResult(testResult);
      
      if (testResult.success) {
        Alert.alert(
          'Test thành công!', 
          `Tìm thấy ${testResult.followingList.length} người đang follow`
        );
      } else {
        Alert.alert('Test thất bại', testResult.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi test API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Following API</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleTest}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Đang test...' : 'Test API User 9'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Kết quả:</Text>
          <Text style={styles.resultText}>
            Status: {result.success ? '✅ Thành công' : '❌ Thất bại'}
          </Text>
          {result.followingList && (
            <Text style={styles.resultText}>
              Số người follow: {result.followingList.length}
            </Text>
          )}
          {result.userInfo && (
            <Text style={styles.resultText}>
              Following count từ user info: {result.userInfo.followingCount}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: '#f8f9fa',
    borderRadius: BORDER_RADIUS.md,
    margin: RESPONSIVE_SPACING.sm,
  },
  title: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: COLORS.white,
    padding: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  resultText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
});

export default FollowingTestComponent;
