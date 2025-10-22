import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

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

// Helper function to get current API status
const getApiStatus = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    isLocalhost: API_CONFIG.BASE_URL.includes('localhost'),
    isNgrok: API_CONFIG.BASE_URL.includes('ngrok'),
    timeout: API_CONFIG.TIMEOUT,
  };
};

// File upload response interface
export interface FileUploadResponse {
  fileName: string;
  filePath: string;
  publicUrl: string;
  url: string; // Alias for publicUrl for backward compatibility
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  userId: string;
}

// Create axios instance for media uploads
const mediaApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.MEDIA_TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Function to get token from AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log('MediaAPI: Getting token from storage:', token ? 'Token exists' : 'No token');
    return token;
  } catch (error) {
    console.error('Error getting token for media API:', error);
    return null;
  }
};

// Request interceptor to add token to header
mediaApi.interceptors.request.use(
  async (config: any) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('MediaAPI: Added Authorization header to request');
    } else {
      console.log('MediaAPI: No token found, request will be sent without Authorization header');
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
mediaApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('MediaAPI: Response error:', error.response?.status);
    console.log('MediaAPI: Error message:', error.message);
    
    // Handle network errors gracefully
    if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
      console.warn('MediaAPI: Network error detected - server may be down or ngrok URL invalid');
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network connection failed. Please check your internet connection or try again later.'
      });
    }
    
    if (error.response?.status === 401) {
      console.log('MediaAPI: Token expired or invalid - clearing auth data');
      
      // Clear auth data when token is invalid
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        console.log('MediaAPI: Cleared auth data due to 401 error');
      } catch (clearError) {
        console.error('MediaAPI: Error clearing auth data:', clearError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Media API functions
export const mediaAPI = {
  // Upload image
  uploadImage: async (
    imageUri: string, 
    folder: string = 'posts',
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> => {
    try {
      console.log('MediaAPI: Starting image upload to folder:', folder);
      
      // Create FormData
      const formData = new FormData();
      
      // Add image file
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      
      // Add folder
      formData.append('folder', folder);
      
      // Make request with progress tracking
      const response = await mediaApi.post('/blob-storage/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('MediaAPI: Image upload successful:', response.data);
      return response.data as FileUploadResponse;
    } catch (error: any) {
      console.error('MediaAPI: Error uploading image:', error);
      throw error;
    }
  },

  // Upload video
  uploadVideo: async (
    videoUri: string, 
    folder: string = 'posts',
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> => {
    try {
      console.log('MediaAPI: Starting video upload to folder:', folder);
      
      // Create FormData
      const formData = new FormData();
      
      // Add video file
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);
      
      // Add folder
      formData.append('folder', folder);
      
      // Make request with progress tracking
      const response = await mediaApi.post('/blob-storage/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('MediaAPI: Video upload successful:', response.data);
      return response.data as FileUploadResponse;
    } catch (error: any) {
      console.error('MediaAPI: Error uploading video:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      console.log('MediaAPI: Deleting file:', filePath);
      
      const response = await mediaApi.delete('/blob-storage/delete', {
        params: { filePath }
      });
      
      console.log('MediaAPI: File deletion successful:', response.status);
      return response.status === 200;
    } catch (error: any) {
      console.error('MediaAPI: Error deleting file:', error);
      throw error;
    }
  },

  // Get file info
  getFileInfo: async (filePath: string): Promise<FileUploadResponse> => {
    try {
      console.log('MediaAPI: Getting file info:', filePath);
      
      const response = await mediaApi.get('/blob-storage/info', {
        params: { filePath }
      });
      
      console.log('MediaAPI: File info retrieved:', response.data);
      return response.data as FileUploadResponse;
    } catch (error: any) {
      console.error('MediaAPI: Error getting file info:', error);
      throw error;
    }
  },

  // Generic file upload (for backward compatibility)
  uploadFile: async (fileUri: string, folder?: string): Promise<FileUploadResponse> => {
    try {
      console.log('MediaAPI: Generic file upload:', fileUri);
      
      // Determine file type based on extension
      const extension = fileUri.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        return await mediaAPI.uploadImage(fileUri, folder);
      } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
        return await mediaAPI.uploadVideo(fileUri, folder);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error: any) {
      console.error('MediaAPI: Error in generic file upload:', error);
      throw error;
    }
  },

  // Test connection
  testConnection: testApiConnection,
  
  // Get API status
  getStatus: getApiStatus,
};

export default mediaApi;