import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Manual configuration
const API_CONFIG = {
  BASE_URL: 'https://41a43dac9aea.ngrok-free.app/api', // Test với localhost trước
  TIMEOUT: 30000,
  MEDIA_TIMEOUT: 120000, // Tăng lên 2 phút cho video
};

// Helper function to test API connectivity
const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('testApiConnection: Testing connection to:', `${API_CONFIG.BASE_URL}/blob-storage/test-connection`);
    
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
    
    console.log('testApiConnection: Response status:', response.status);
    console.log('testApiConnection: Response ok:', response.ok);
    
    return response.ok;
  } catch (error: any) {
    console.error('testApiConnection: Connection test failed:', error);
    console.error('testApiConnection: Error type:', error.name);
    console.error('testApiConnection: Error message:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('testApiConnection: Request timed out');
    }
    
    return false;
  }
};

// Media API interfaces
export interface FileUploadResponse {
  fileName: string;
  filePath: string;
  publicUrl: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  userId: string;
  fileType: string;
}

export interface FileUrlResponse {
  url: string;
  expiresAt?: string;
}

export interface FileListResponse {
  files: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  }>;
}

// Cấu hình axios instance cho media API
const mediaApi = axios.create({
  baseURL: 'https://ba03ec5e177c.ngrok-free.app/api',
  timeout: 30000, // Tăng timeout cho upload
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.MEDIA_TIMEOUT, // Use MEDIA_TIMEOUT from API_CONFIG
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor để thêm token vào header
mediaApi.interceptors.request.use(
  async (config) => {
    // Lấy token từ AsyncStorage
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('MediaAPI: Getting token from storage:', token ? 'Token exists' : 'No token');
      console.log('MediaAPI: Token length:', token ? token.length : 0);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('MediaAPI: Added Authorization header to request');
        console.log('MediaAPI: Request URL:', config.url);
      } else {
        console.log('MediaAPI: No token found, request will be sent without Authorization header');
      }
    } catch (error) {
      console.error('Error getting token for media API:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
mediaApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('MediaAPI: Response error:', error.response?.status);
    console.log('MediaAPI: Error message:', error.message);
    console.log('MediaAPI: Error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('MediaAPI: Token expired or invalid');
      console.log('MediaAPI: Request URL:', error.config?.url);
      console.log('MediaAPI: Request headers:', error.config?.headers);
    }
    return Promise.reject(error);
  }
);

// Test function để debug token
export const testToken = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log('MediaAPI Test: Token exists:', !!token);
    console.log('MediaAPI Test: Token length:', token ? token.length : 0);
    console.log('MediaAPI Test: Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    return token;
  } catch (error) {
    console.error('MediaAPI Test: Error getting token:', error);
    return null;
  }
};

// Media API endpoints
export const mediaAPI = {
  // Upload file
  uploadFile: async (file: any, folder: string = 'uploads', token?: string) => {
    try {
      console.log('MediaAPI: Starting file upload...');
      console.log('MediaAPI: File info:', {
        uri: file.uri,
        type: file.type,
        fileName: file.fileName,
        size: file.fileSize || 'unknown'
      });
      console.log('MediaAPI: Target folder:', folder);
      console.log('MediaAPI: API Base URL:', API_CONFIG.BASE_URL);

      // Skip connection test for now since ngrok is working
      console.log('MediaAPI: Skipping connection test, proceeding with upload...');

      // Get token from AsyncStorage for manual header
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không có token để upload. Vui lòng đăng nhập lại.');
      }

      // Create FormData manually
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'image.jpg',
      } as any);

      console.log('MediaAPI: Sending upload request with fetch...');
      console.log('MediaAPI: Upload URL:', `${API_CONFIG.BASE_URL}/blob-storage/media/upload?folder=${folder}`);
      
      // Use fetch instead of axios for better ngrok compatibility
      const response = await fetch(`${API_CONFIG.BASE_URL}/blob-storage/media/upload?folder=${folder}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      console.log('MediaAPI: Fetch response status:', response.status);
      console.log('MediaAPI: Fetch response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MediaAPI: Upload failed with status:', response.status);
        console.error('MediaAPI: Error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('MediaAPI: Upload successful:', result);
      return result;
    } catch (error: any) {
      console.error('MediaAPI: Upload file error:', error);
      console.error('MediaAPI: Error type:', error.name);
      console.error('MediaAPI: Error message:', error.message);
      console.error('MediaAPI: Error code:', error.code);
      console.error('MediaAPI: Error response:', error.response);
      console.error('MediaAPI: Error config:', error.config);
      
      // Provide more specific error messages
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || error.name === 'NetworkError') {
        console.error('MediaAPI: Network error detected');
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.');
      } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        console.error('MediaAPI: Timeout error detected');
        throw new Error('Upload timeout. File có thể quá lớn hoặc kết nối chậm. Vui lòng thử lại.');
      } else if (error.response?.status === 401) {
        console.error('MediaAPI: Unauthorized error detected');
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 413) {
        console.error('MediaAPI: File too large error detected');
        throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn.');
      } else if (error.response?.data?.message) {
        console.error('MediaAPI: Server error message:', error.response.data.message);
        throw new Error(error.response.data.message);
      } else {
        console.error('MediaAPI: Unknown error, throwing generic message');
        throw new Error(`Không thể tải lên file: ${error.message || 'Lỗi không xác định'}`);
      }
    }
  },

  // Get file URL
  getFileUrl: async (filePath: string, token?: string) => {
    try {
      const response = await mediaApi.get('/blob-storage/media/url', {
        params: { filePath },
        // Token sẽ được thêm tự động bởi request interceptor
      });

      return response.data;
    } catch (error) {
      console.error('Get file URL error:', error);
      throw error;
    }
  },

  // Download file
  downloadFile: async (filePath: string, token?: string) => {
    try {
      const response = await mediaApi.get('/blob-storage/media/download', {
        params: { filePath },
        // Token sẽ được thêm tự động bởi request interceptor
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (filePath: string, token?: string) => {
    try {
      const response = await mediaApi.delete('/blob-storage/media/delete', {
        params: { filePath },
        // Token sẽ được thêm tự động bởi request interceptor
      });

      return response.data;
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  },

  // List files in folder
  listFiles: async (folder: string = 'uploads', token?: string) => {
    try {
      const response = await mediaApi.get('/blob-storage/media/list', {
        params: { folder },
        // Token sẽ được thêm tự động bởi request interceptor
      });

      return response.data;
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },
};
