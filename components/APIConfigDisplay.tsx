import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { API_CONFIG, getAPIUrl } from '../config/api';

export const APIConfigDisplay = () => {
  const showAPIConfig = () => {
    const currentUrl = getAPIUrl();
    const config = {
      currentURL: currentUrl,
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      debug: API_CONFIG.DEBUG,
    };
    
    Alert.alert(
      'API Configuration',
      `Current URL: ${currentUrl}\n\nBase URL: ${API_CONFIG.BASE_URL}\nTimeout: ${API_CONFIG.TIMEOUT}ms\nDebug: ${API_CONFIG.DEBUG}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ API Config</Text>
      <Text style={styles.urlText}>URL: {getAPIUrl()}</Text>
      <TouchableOpacity style={styles.button} onPress={showAPIConfig}>
        <Text style={styles.buttonText}>Show Full Config</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    margin: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
