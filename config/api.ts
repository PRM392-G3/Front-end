// API Configuration - Unified Configuration
// Đọc từ environment variable
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    console.log('[API Config] Using URL from .env:', envUrl);
    return envUrl;
  }
  // Fallback to ngrok nếu không có env
  // Note: URL should include /api as configured by user
  const fallbackUrl = 'https://2fefeca44269.ngrok-free.app/api';
  console.log('[API Config] Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

export const API_CONFIG = {
  // Backend URL - từ env hoặc fallback
  BASE_URL: getBaseUrl(),
  
  // Timeout settings - 2 minutes for slow connections
  TIMEOUT: 120000,
  MEDIA_TIMEOUT: 120000,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  
  // Debug mode
  DEBUG: __DEV__,
};

// Helper function to get current API URL
export const getAPIUrl = () => {
  const url = getBaseUrl();
  console.log('[API Config] Current Base URL:', url);
  return url;
};

// Helper function to log API calls
export const logAPICall = (method: string, url: string, data?: any) => {
  if (API_CONFIG.DEBUG) {
    console.log(`[API] ${method.toUpperCase()} ${url}`, data ? { data } : '');
  }
};

// Helper function to log API responses
export const logAPIResponse = (method: string, url: string, response: any) => {
  if (API_CONFIG.DEBUG) {
    console.log(`[API] ${method.toUpperCase()} ${url} - Response:`, response);
  }
};

// Helper function to log API errors
export const logAPIError = (method: string, url: string, error: any) => {
  if (API_CONFIG.DEBUG) {
    console.error(`[API] ${method.toUpperCase()} ${url} - Error:`, error);
  }
};

// Helper function to test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    const url = getAPIUrl();
    console.log('[API] Testing connection to:', url);
    
    const response = await fetch(`${url}/blob-storage/test-connection`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error: any) {
    console.error('API connection test failed:', error.message);
    return false;
  }
};

// Helper function to get current API status
export const getApiStatus = () => {
  const url = getAPIUrl();
  return {
    baseUrl: url,
    isLocalhost: url.includes('localhost'),
    isNgrok: url.includes('ngrok'),
    timeout: API_CONFIG.TIMEOUT,
  };
};