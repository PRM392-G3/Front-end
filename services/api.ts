import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getAPIUrl, logAPICall, logAPIResponse, logAPIError } from '../config/api';

// User interface
export interface User {
  id: number;
  email: string;
  fullName: string;
  coverImageUrl: string | null;
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
  baseURL: getAPIUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  async (config) => {
    // Log API call
    logAPICall(config.method || 'GET', config.url || '', config.data);
    
    // Lấy token từ AsyncStorage
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token added to request');
      } else {
        console.log('[API] No token found');
      }
    } catch (error) {
      console.error('[API] Error getting token:', error);
    }
    return config;
  },
  (error) => {
    logAPIError('REQUEST', 'INTERCEPTOR', error);
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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

// Interface cho người dùng được follow
export interface FollowedUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
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

  // Lấy danh sách những người mà user đang follow
  getFollowingList: async (userId: number) => {
    try {
      console.log(`[API] Getting following list for user ${userId}`);
      const response = await api.get(`/User/${userId}/following`);
      console.log(`[API] Following list response:`, response.data);
      return response.data as FollowedUser[];
    } catch (error: any) {
      console.error(`[API] Error getting following list for user ${userId}:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

  // Lấy danh sách người theo dõi (followers)
  getFollowersList: async (userId: number) => {
    try {
      console.log(`[API] Getting followers list for user ${userId}`);
      const response = await api.get(`/User/${userId}/followers`);
      console.log(`[API] Followers list response:`, response.data);
      return response.data as User[];
    } catch (error: any) {
      console.error(`[API] Error getting followers list for user ${userId}:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

  // Lấy thông tin chi tiết của một user
  getUserById: async (userId: number) => {
    try {
      console.log(`[API] Getting user info for user ${userId}`);
      const response = await api.get(`/User/${userId}`);
      console.log(`[API] User info response:`, response.data);
      return response.data as User;
    } catch (error: any) {
      console.error(`[API] Error getting user info for user ${userId}:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

  // Hủy theo dõi một user
  // followerId: ID của người đang follow (user hiện tại)
  // followingId: ID của người được follow (sẽ bị hủy follow)
  unfollowUser: async (followerId: number, followingId: number) => {
    try {
      const response = await api.delete(`/User/${followerId}/follow/${followingId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Theo dõi một user
  // followerId: ID của người sẽ follow (user hiện tại)
  // followingId: ID của người sẽ được follow
  followUser: async (followerId: number, followingId: number) => {
    try {
      console.log(`[API] Following user ${followingId} by user ${followerId}`);
      const response = await api.post(`/User/${followerId}/follow/${followingId}`);
      console.log(`[API] Follow response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[API] Error following user ${followingId}:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

  // Tìm kiếm người dùng
  searchUsers: async (query: string, page: number = 1, limit: number = 20) => {
    try {
      console.log(`[API] Searching users with query: "${query}", page: ${page}, limit: ${limit}`);
      const response = await api.get(`/User/search`, {
        params: { q: query, page, limit }
      });
      console.log(`[API] Search users response:`, response.data);
      return response.data as {
        users: User[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      };
    } catch (error: any) {
      console.error(`[API] Error searching users:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

  // Lấy danh sách người dùng gợi ý (suggested users)
  getSuggestedUsers: async (limit: number = 10) => {
    try {
      console.log(`[API] Getting suggested users, limit: ${limit}`);
      const response = await api.get(`/User/suggested`, {
        params: { limit }
      });
      console.log(`[API] Suggested users response:`, response.data);
      return response.data as User[];
    } catch (error: any) {
      console.error(`[API] Error getting suggested users:`, error);
      console.error(`[API] Error response:`, error.response?.data);
      console.error(`[API] Error status:`, error.response?.status);
      throw error;
    }
  },

};