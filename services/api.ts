import axios from 'axios';
import { API_CONFIG } from '@/constants/api';

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
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    // Token sẽ được thêm bởi AuthContext
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
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      console.log('Token expired or invalid');
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
