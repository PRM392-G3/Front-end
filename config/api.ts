// API Configuration
export const API_CONFIG = {
  // Ngrok URL - cần cập nhật khi restart ngrok
  BASE_URL: 'https://ba03ec5e177c.ngrok-free.app/api',
  
  // Local development URL (nếu chạy local)
  LOCAL_URL: 'http://localhost:5000/api',
  
  // Timeout settings
  TIMEOUT: 15000,
  
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
