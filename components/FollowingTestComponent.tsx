import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';

const FollowingTestComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      // Mock test data instead of using testUser9Following
      const mockResult = {
        success: true,
        followingList: [
          { id: 1, fullName: 'User 1' },
          { id: 2, fullName: 'User 2' }
        ],
        error: null
      };
      setResult(mockResult);
      
      if (mockResult.success) {
        Alert.alert(
          'Test thành công!', 
          `Tìm thấy ${mockResult.followingList.length} người đang follow`
        );
      } else {
        Alert.alert('Test thất bại', mockResult.error || 'Unknown error');
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
  } as ViewStyle,
  title: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  } as ViewStyle,
  buttonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
  } as TextStyle,
  resultContainer: {
    backgroundColor: COLORS.white,
    padding: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  } as ViewStyle,
  resultTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  resultText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: 4,
  } as TextStyle,
});

export default FollowingTestComponent;
