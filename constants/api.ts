// API Configuration
export const API_CONFIG = {
  // Ngrok endpoint - cập nhật khi ngrok restart
  BASE_URL: 'https://bobby-unpargeted-nicole.ngrok-free.dev/api',
  
  // Local development
  // BASE_URL: 'http://localhost:7097/api',
  
  // Production (khi deploy)
  // BASE_URL: 'https://your-production-api.com/api',
  
  TIMEOUT: 15000,
  MEDIA_TIMEOUT: 30000,
  
  HEADERS: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
};

// Helper function để lấy base URL
export const getApiBaseUrl = () => {
  return API_CONFIG.BASE_URL;
};
