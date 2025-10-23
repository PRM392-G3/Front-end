// API Test Utilities
import { API_CONFIG } from '../config/api';

export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection to:', API_CONFIG.BASE_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/blob-storage/test-connection`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('API connection test result:', response.ok);
    return response.ok;
  } catch (error: any) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export const getApiStatus = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    isLocalhost: API_CONFIG.BASE_URL.includes('localhost'),
    isNgrok: API_CONFIG.BASE_URL.includes('ngrok'),
    timeout: API_CONFIG.TIMEOUT,
  };
};