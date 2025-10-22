import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FollowingDebugComponent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { user, token } = useAuth();

  const testFollowingAPI = async () => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Không có thông tin user');
      return;
    }

    setLoading(true);
    try {
      console.log('[FollowingDebug] Testing following API...');
      console.log('[FollowingDebug] User ID:', user.id);
      console.log('[FollowingDebug] Token exists:', !!token);
      
      // Test 1: Get user info
      console.log('[FollowingDebug] Test 1: Getting user info...');
      const userInfo = await userAPI.getUserById(user.id);
      console.log('[FollowingDebug] User info result:', userInfo);
      
      // Test 2: Get following list
      console.log('[FollowingDebug] Test 2: Getting following list...');
      const followingList = await userAPI.getFollowingList(user.id);
      console.log('[FollowingDebug] Following list result:', followingList);
      
      // Test 3: Check token
      const storedToken = await AsyncStorage.getItem('auth_token');
      console.log('[FollowingDebug] Stored token exists:', !!storedToken);
      console.log('[FollowingDebug] Stored token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'No token');
      
      setResult({
        userInfo,
        followingList,
        tokenExists: !!token,
        storedTokenExists: !!storedToken,
        userId: user.id,
        followersCount: userInfo.followersCount,
        followingCount: userInfo.followingCount,
        followingListLength: followingList.length
      });
      
      Alert.alert('Thành công', `Đã test API thành công!\nFollowing count: ${followingList.length}\nFollowers count: ${userInfo.followersCount}`);
      
    } catch (error: any) {
      console.error('[FollowingDebug] Error:', error);
      console.error('[FollowingDebug] Error response:', error.response?.data);
      console.error('[FollowingDebug] Error status:', error.response?.status);
      
      setResult({
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      Alert.alert('Lỗi', `API test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Thành công', 'Đã xóa tất cả dữ liệu auth');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa dữ liệu auth');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Following Debug</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>User ID: {user?.id || 'N/A'}</Text>
        <Text style={styles.infoText}>Token exists: {token ? 'Yes' : 'No'}</Text>
        <Text style={styles.infoText}>Followers count: {user?.followersCount || 'N/A'}</Text>
        <Text style={styles.infoText}>Following count: {user?.followingCount || 'N/A'}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testFollowingAPI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Following API'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={clearAuthData}
      >
        <Text style={styles.buttonText}>Clear Auth Data</Text>
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
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    maxHeight: 200,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
