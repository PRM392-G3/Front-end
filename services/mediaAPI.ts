import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  baseURL: 'https://elane-unsweating-continuately.ngrok-free.dev/api',
  timeout: 30000, // Tăng timeout cho upload
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
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'image.jpg',
      } as any);

      const response = await mediaApi.post('/blob-storage/media/upload', formData, {
        params: { folder },
        headers: {
          'Content-Type': 'multipart/form-data',
          // Token sẽ được thêm tự động bởi request interceptor
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
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
