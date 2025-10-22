// API Configuration - Unified Configuration
export const API_CONFIG = {
  // Ngrok URL - cần cập nhật khi restart ngrok
  BASE_URL: 'https://d1423eb38307.ngrok-free.app/api',
  
  // Local development URL (nếu chạy local)
  LOCAL_URL: 'http://localhost:5000/api',
  
  // Timeout settings
  TIMEOUT: 15000,
  MEDIA_TIMEOUT: 30000,
  
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
  // Trong development, có thể switch giữa ngrok và local
  if (__DEV__ && false) { // Set thành true để dùng local URL
    return API_CONFIG.LOCAL_URL;
  }
  return API_CONFIG.BASE_URL;
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
    console.log('testApiConnection: Testing connection to:', `${API_CONFIG.BASE_URL}/blob-storage/test-connection`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/blob-storage/test-connection`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('testApiConnection: Response status:', response.status);
    console.log('testApiConnection: Response ok:', response.ok);
    
    return response.ok;
  } catch (error: any) {
    console.error('testApiConnection: Connection test failed:', error);
    console.error('testApiConnection: Error type:', error.name);
    console.error('testApiConnection: Error message:', error.message);
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      console.error('testApiConnection: Request timed out');
    }
    
    return false;
  }
};

// Helper function to get current API status
export const getApiStatus = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    isLocalhost: API_CONFIG.BASE_URL.includes('localhost'),
    isNgrok: API_CONFIG.BASE_URL.includes('ngrok'),
    timeout: API_CONFIG.TIMEOUT,
  };
};