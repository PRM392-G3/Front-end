import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User interface
export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string;
  bio: string | null;
  dateOfBirth: string | null;
  location: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
}

// Auth response interface
export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// Cấu hình axios instance
const api = axios.create({
  baseURL: 'https://selenographical-ashlynn-moonily.ngrok-free.dev/api',
  timeout: 15000, // Tăng timeout cho ngrok
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bỏ qua warning của ngrok
  },
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  async (config) => {
    // Lấy token từ AsyncStorage
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('MainAPI: Getting token from storage:', token ? 'Token exists' : 'No token');
      console.log('MainAPI: Token length:', token ? token.length : 0);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('MainAPI: Added Authorization header to request');
        console.log('MainAPI: Request URL:', config.url);
      } else {
        console.log('MainAPI: No token found, request will be sent without Authorization header');
      }
    } catch (error) {
      console.error('Error getting token for main API:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('MainAPI: Response error:', error.response?.status);
    console.log('MainAPI: Error message:', error.message);
    console.log('MainAPI: Error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('MainAPI: Token expired or invalid');
      console.log('MainAPI: Request URL:', error.config?.url);
      console.log('MainAPI: Request headers:', error.config?.headers);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // Đăng nhập với email/password
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/Auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng ký tài khoản mới
  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/Auth/register', {
        email: userData.email,
        password: userData.password,
        fullName: userData.name,
        phoneNumber: userData.phone,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng nhập với Google
  googleLogin: async (googleToken: string) => {
    try {
      const response = await api.post('/Auth/google-login', {
        googleToken,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate token
  validateToken: async (token: string) => {
    try {
      const response = await api.post('/Auth/validate-token', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;

// User update payload interface
export interface UpdateUserPayload {
  fullName: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string
  location: string;
}

export const userAPI = {
  updateUser: async (id: number, data: UpdateUserPayload) => {
    try {
      const response = await api.put(`/User/${id}`, data);
      return response.data as User;
    } catch (error) {
      throw error;
    }
  },
};