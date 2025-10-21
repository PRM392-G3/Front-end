import axios from 'axios';
import { API_CONFIG } from '@/constants/api';

// Media API interfaces
export interface FileUploadResponse {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
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
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.MEDIA_TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor để thêm token vào header
mediaApi.interceptors.request.use(
  (config) => {
    // Token sẽ được thêm bởi AuthContext
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
    if (error.response?.status === 401) {
      console.log('Token expired or invalid');
    }
    return Promise.reject(error);
  }
);

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
          ...(token && { Authorization: `Bearer ${token}` }),
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
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      return response.data;
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },
};
