import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { postAPI } from '@/services/api';

export const PostLikesTestComponent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testPostLikesAPI = async () => {
    setLoading(true);
    try {
      console.log('[PostLikesTest] Testing Post Likes API...');
      
      // Test with a known post ID
      const testPostId = 32; // From your error log
      console.log(`[PostLikesTest] Testing with post ID: ${testPostId}`);
      
      const likesData = await postAPI.getPostLikes(testPostId);
      console.log('[PostLikesTest] API Response:', likesData);
      
      setResult({
        success: true,
        postId: testPostId,
        likesCount: likesData.length,
        likes: likesData,
        message: `Found ${likesData.length} users who liked post ${testPostId}`
      });
      
      Alert.alert('Thành công', `Tìm thấy ${likesData.length} người đã thích bài viết ${testPostId}`);
      
    } catch (error: any) {
      console.error('[PostLikesTest] Error:', error);
      
      let errorMessage = 'Unknown error';
      let errorDetails = {};
      
      if (error.response?.status === 404) {
        errorMessage = 'API endpoint không tồn tại (404)';
        errorDetails = {
          status: 404,
          message: 'Backend chưa implement endpoint /Post/{postId}/likes',
          suggestion: 'Cần backend team implement endpoint này'
        };
      } else if (error.response?.status === 400) {
        errorMessage = 'Bad Request (400)';
        errorDetails = {
          status: 400,
          data: error.response.data,
          url: error.config?.url
        };
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network Error';
        errorDetails = {
          code: error.code,
          message: error.message
        };
      }
      
      setResult({
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testMultiplePosts = async () => {
    setLoading(true);
    try {
      console.log('[PostLikesTest] Testing multiple posts...');
      
      const testPostIds = [1, 2, 3, 32]; // Test multiple post IDs
      const results = [];
      
      for (const postId of testPostIds) {
        try {
          const likesData = await postAPI.getPostLikes(postId);
          results.push({
            postId,
            success: true,
            likesCount: likesData.length
          });
        } catch (error: any) {
          results.push({
            postId,
            success: false,
            error: error.response?.status || error.message
          });
        }
      }
      
      setResult({
        success: true,
        message: 'Multiple posts test completed',
        results
      });
      
      Alert.alert('Hoàn thành', 'Đã test nhiều bài viết');
      
    } catch (error: any) {
      console.error('[PostLikesTest] Multiple test error:', error);
      Alert.alert('Lỗi', 'Không thể test nhiều bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Post Likes API Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testPostLikesAPI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Post Likes API (Post ID: 32)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
        onPress={testMultiplePosts}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Multiple Posts'}
        </Text>
      </TouchableOpacity>

      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Kết quả:</Text>
          <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: RESPONSIVE_SPACING.lg,
    backgroundColor: COLORS.background.secondary,
    margin: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.accent.primary,
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.text.secondary,
  },
  buttonText: {
    color: COLORS.text.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: COLORS.background.primary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.md,
    maxHeight: 300,
  },
  resultTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: RESPONSIVE_SPACING.sm,
    color: COLORS.text.primary,
  },
  resultText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
});
