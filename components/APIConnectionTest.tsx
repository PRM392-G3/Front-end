import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const APIConnectionTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAPIConnection = async () => {
    setLoading(true);
    try {
      console.log('[APITest] Testing API connection...');
      
      // Test 1: Basic connectivity
      const baseURL = 'https://2c934862db4e.ngrok-free.app/api';
      console.log('[APITest] Base URL:', baseURL);
      
      // Test 2: Check if server is reachable
      const healthResponse = await axios.get(`${baseURL}/health`, {
        timeout: 10000,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });
      console.log('[APITest] Health check response:', healthResponse.data);
      
      // Test 3: Check auth token
      const token = await AsyncStorage.getItem('auth_token');
      console.log('[APITest] Token exists:', !!token);
      
      // Test 4: Test User endpoint
      if (token) {
        const userResponse = await axios.get(`${baseURL}/User/1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        });
        console.log('[APITest] User endpoint response:', userResponse.data);
        
        // Test 5: Test Following endpoint
        const followingResponse = await axios.get(`${baseURL}/User/1/following`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        });
        console.log('[APITest] Following endpoint response:', followingResponse.data);
        
        setResult({
          health: healthResponse.data,
          user: userResponse.data,
          following: followingResponse.data,
          tokenExists: !!token,
          baseURL,
        });
        
        Alert.alert('Thành công', 'API connection test passed!');
      } else {
        setResult({
          health: healthResponse.data,
          tokenExists: false,
          baseURL,
          error: 'No auth token found'
        });
        
        Alert.alert('Cảnh báo', 'API server is reachable but no auth token found');
      }
      
    } catch (error: any) {
      console.error('[APITest] Error:', error);
      
      let errorMessage = 'Unknown error';
      let errorDetails = {};
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network connection failed';
        errorDetails = {
          code: error.code,
          message: error.message,
          baseURL: 'https://2c934862db4e.ngrok-free.app/api'
        };
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status}`;
        errorDetails = {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
          headers: error.config?.headers
        };
      } else if (error.request) {
        errorMessage = 'No response from server';
        errorDetails = {
          request: error.request,
          timeout: error.config?.timeout
        };
      }
      
      setResult({
        error: errorMessage,
        details: errorDetails,
        baseURL: 'https://2c934862db4e.ngrok-free.app/api'
      });
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 API Connection Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testAPIConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test API Connection'}
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
  button: {
    backgroundColor: '#28a745',
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
    maxHeight: 300,
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
