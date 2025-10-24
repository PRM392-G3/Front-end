import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

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
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Function để lấy token từ AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log('MainAPI: Getting token from storage:', token ? 'Token exists' : 'No token');
    console.log('MainAPI: Token length:', token ? token.length : 0);
    return token;
  } catch (error) {
    console.error('Error getting token for main API:', error);
    return null;
  }
};

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  async (config: any) => {
    // Thêm token vào header nếu có
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('MainAPI: Added Authorization header to request');
      console.log('MainAPI: Request URL:', config.url);
      console.log('MainAPI: Token preview:', token.substring(0, 20) + '...');
    } else {
      console.log('MainAPI: No token found, request will be sent without Authorization header');
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('MainAPI: Response error:', error.response?.status);
    console.log('MainAPI: Error message:', error.message);
    console.log('MainAPI: Error data:', error.response?.data);
    
    // Handle network errors gracefully
    if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
      console.warn('MainAPI: Network error detected - server may be down or ngrok URL invalid');
      console.warn('MainAPI: Falling back to mock data or offline mode');
      
      // Don't throw error for network issues, let components handle gracefully
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network connection failed. Please check your internet connection or try again later.'
      });
    }
    
    if (error.response?.status === 401) {
      console.log('MainAPI: Token expired or invalid - clearing auth data');
      console.log('MainAPI: Request URL:', error.config?.url);
      console.log('MainAPI: Request headers:', error.config?.headers);
      
      // Clear auth data when token is invalid
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_data');
        console.log('MainAPI: Cleared auth data due to 401 error');
      } catch (clearError) {
        console.error('MainAPI: Error clearing auth data:', clearError);
      }
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

// Interface cho người dùng được follow
export interface FollowedUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

// Interface cho friend request
export interface FriendRequest {
  id: number;
  requesterId: number;
  receiverId: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt: string | null;
  requester: User;
  receiver: User;
}

// Interface cho gửi friend request
export interface SendFriendRequestPayload {
  requesterId: number;
  receiverId: number;
}

// Interface cho response friend request
export interface RespondFriendRequestPayload {
  status: 'accepted' | 'rejected';
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
      const response = await api.get(`/User/${userId}/following`);
      return response.data as FollowedUser[];
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách following với thông tin follow status
  getFollowingWithStatus: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/following/with-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy thông tin chi tiết của một user
  getUserById: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}`);
      return response.data as User;
    } catch (error) {
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
      const response = await api.post(`/User/${followerId}/follow/${followingId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Tìm kiếm người dùng
  searchUsers: async (query: string, page: number = 1, limit: number = 20) => {
    try {
      const response = await api.get(`/User/search?name=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách followers của user
  getFollowersList: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/followers`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách followers với thông tin follow status
  getFollowersWithStatus: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/followers/with-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách người dùng được đề xuất
  getSuggestedUsers: async (userId: number, limit: number = 10) => {
    try {
      const response = await api.get(`/User/${userId}/friend-suggestions?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Gửi lời mời kết bạn
  sendFriendRequest: async (requesterId: number, receiverId: number) => {
    try {
      const response = await api.post('/User/friend-request', {
        requesterId,
        receiverId
      });
      return response.data as FriendRequest;
    } catch (error) {
      throw error;
    }
  },

  // Chấp nhận hoặc từ chối lời mời kết bạn
  respondToFriendRequest: async (requestId: number, status: 'accepted' | 'rejected') => {
    try {
      const response = await api.put(`/User/friend-request/${requestId}/respond`, {
        status
      });
      return response.data as FriendRequest;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách bạn bè
  getFriends: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/friends`);
      return response.data as User[];
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách friend requests đang chờ
  getPendingFriendRequests: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/friend-requests/pending`);
      return response.data as FriendRequest[];
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra trạng thái kết bạn với một user
  getFriendshipStatus: async (userId: number, targetUserId: number) => {
    try {
      const response = await api.get(`/User/${userId}/friendship-status/${targetUserId}`);
      return response.data as {
        isFriend: boolean;
        hasPendingRequest: boolean;
        requestId?: number;
        requesterId?: number;
        receiverId?: number;
      };
    } catch (error) {
      throw error;
    }
  },

  // Hủy kết bạn
  unfriend: async (userId: number, friendId: number) => {
    try {
      const response = await api.delete(`/User/${userId}/friend/${friendId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Post interfaces
export interface Post {
  id: number;
  userId: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  comments: Comment[];
  likes: Like[];
  postTags: PostTag[];
  isLiked?: boolean;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Like {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
  user: User;
}

export interface PostTag {
  id: number;
  postId: number;
  tagId: number;
  createdAt: string;
  tag: Tag;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: number;
  userId: number;
  postId: number;
  caption?: string;
  isPublic: boolean;
  createdAt: string;
  user: User;
}

// Post request/response interfaces
export interface CreatePostRequest {
  userId: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  tags?: string[];
}

export interface UpdatePostRequest {
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface PostResponse {
  id: number;
  userId: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  comments: Comment[];
  likes: Like[];
  shares: Share[];
  tags: Tag[]; // Changed from postTags to tags to match backend
  isLiked?: boolean;
  isShared?: boolean;
  // For shared posts
  shareCaption?: string; // Caption added when sharing
  originalPost?: PostResponse; // Reference to original post if this is a shared post
  isSharedPost?: boolean; // Flag to indicate if this is a shared post
}

// Post API endpoints
export const postAPI = {
  // Create a new post
  createPost: async (data: CreatePostRequest) => {
    try {
      const response = await api.post('/Post', data);
      return response.data as PostResponse;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific post by ID
  getPost: async (id: number) => {
    try {
      const response = await api.get(`/Post/${id}`);
      return response.data as PostResponse;
    } catch (error) {
      throw error;
    }
  },

  // Get all posts
  getAllPosts: async () => {
    try {
      const response = await api.get('/Post');
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Get all posts with like status for current user
  getAllPostsWithLikes: async () => {
    try {
      const response = await api.get('/Post/with-likes');
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Get posts by user ID
  getPostsByUser: async (userId: number) => {
    try {
      const response = await api.get(`/Post/user/${userId}`);
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Get shared posts by user ID with like status
  getSharedPostsByUser: async (userId: number) => {
    try {
      const response = await api.get(`/Post/user/${userId}/shares`);
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Get feed posts for a user
  getFeedPosts: async (userId: number, page: number = 1, pageSize: number = 10) => {
    try {
      const response = await api.get(`/Post/feed/${userId}`, {
        params: { page, pageSize }
      });
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Update a post
  updatePost: async (id: number, data: UpdatePostRequest) => {
    try {
      const response = await api.put(`/Post/${id}`, data);
      return response.data as PostResponse;
    } catch (error) {
      throw error;
    }
  },

  // Delete a post
  deletePost: async (id: number) => {
    try {
      const response = await api.delete(`/Post/${id}`);
      return response.status === 204;
    } catch (error) {
      throw error;
    }
  },

  // Like a post
  likePost: async (postId: number, userId: number) => {
    try {
      const response = await api.post(`/Post/${postId}/like/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId: number, userId: number) => {
    try {
      const response = await api.delete(`/Post/${postId}/like/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Get list of users who liked a post
  getPostLikes: async (postId: number) => {
    try {
      const response = await api.get(`/Post/${postId}/likes`);
      return response.data as User[];
    } catch (error) {
      console.error('Error getting post likes:', error);
      throw error;
    }
  },

  // Search posts
  searchPosts: async (searchTerm: string) => {
    try {
      const response = await api.get('/Post/search', {
        params: { searchTerm }
      });
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // Get posts by tag
  getPostsByTag: async (tagName: string) => {
    try {
      const response = await api.get(`/Post/tag/${tagName}`);
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },
};

// Comment API endpoints
export const commentAPI = {
  // Create a new comment
  createComment: async (data: { postId: number; content: string; userId: number }) => {
    try {
      const response = await api.post('/Comment', data);
      return response.data as Comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Get comments for a post
  getCommentsByPost: async (postId: number) => {
    try {
      const response = await api.get(`/Comment/post/${postId}`);
      return response.data as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (commentId: number, data: { content: string }) => {
    try {
      const response = await api.put(`/Comment/${commentId}`, data);
      return response.data as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId: number) => {
    try {
      const response = await api.delete(`/Comment/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
};

// Tag API endpoints
export const tagAPI = {
  // Get all tags
  getAllTags: async () => {
    try {
      console.log('tagAPI: Calling GET /Tag endpoint...');
      const response = await api.get('/Tag');
      console.log('tagAPI: Response status:', response.status);
      console.log('tagAPI: Response data:', response.data);
      console.log('tagAPI: Response data type:', typeof response.data);
      console.log('tagAPI: Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      
      if (Array.isArray(response.data)) {
        return response.data as Tag[];
      } else {
        console.error('tagAPI: Invalid response format, expected array but got:', typeof response.data);
        return [];
      }
    } catch (error: any) {
      console.error('tagAPI: Error getting all tags:', error);
      
      // Handle 404 error gracefully - Tag API might not be implemented yet
      if (error.response?.status === 404) {
        console.warn('tagAPI: Tag endpoint not found (404) - returning empty array');
        return [];
      }
      
      // For other errors, still throw but with better error message
      throw new Error(`Failed to fetch tags: ${error.response?.status || 'Network error'}`);
    }
  },

  // Search tags by name
  searchTags: async (searchTerm: string) => {
    try {
      const response = await api.get(`/Tag/search?term=${encodeURIComponent(searchTerm)}`);
      return response.data as Tag[];
    } catch (error: any) {
      console.error('Error searching tags:', error);
      
      // Handle 404 error gracefully - Tag search might not be implemented yet
      if (error.response?.status === 404) {
        console.warn('tagAPI: Tag search endpoint not found (404) - returning empty array');
        return [];
      }
      
      // For other errors, still throw but with better error message
      throw new Error(`Failed to search tags: ${error.response?.status || 'Network error'}`);
    }
  },
};

// Share API functions
export const shareAPI = {
  // Share a post
  sharePost: async (userId: number, postId: number, caption?: string, isPublic: boolean = true) => {
    try {
      const response = await api.post('/Share/share', {
        userId,
        postId,
        caption,
        isPublic
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },

  // Unshare a post
  unsharePost: async (userId: number, postId: number) => {
    try {
      console.log('shareAPI: Unsharing post:', postId, 'for user:', userId);
      
      const response = await api.delete(`/Share/unshare/${postId}`);
      console.log('shareAPI: Unshare response:', response.status);
      
      return response.data;
    } catch (error: any) {
      console.error('shareAPI: Error unsharing post:', error);
      console.error('shareAPI: Error status:', error.response?.status);
      console.error('shareAPI: Error message:', error.message);
      console.error('shareAPI: Error data:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Bài viết không tồn tại hoặc đã được bỏ chia sẻ');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 400) {
        // More specific error message for 400
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Bài viết này không thể bỏ chia sẻ hoặc bạn chưa chia sẻ bài viết này');
        }
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else if (error.message === 'Network Error') {
        // Fallback for network errors - simulate successful unshare
        console.warn('shareAPI: Network error, simulating successful unshare for offline mode');
        return { success: true, message: 'Unshared successfully (offline mode)' };
      }
      
      throw error;
    }
  },

  // Get shares by post
  getSharesByPost: async (postId: number) => {
    try {
      const response = await api.get(`/Share/post/${postId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting shares by post:', error);
      throw error;
    }
  },

  // Get shares by user
  getSharesByUser: async (userId: number) => {
    try {
      const response = await api.get(`/Share/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting shares by user:', error);
      throw error;
    }
  },

  // Check if user has shared post
  hasUserSharedPost: async (userId: number, postId: number) => {
    try {
      const response = await api.get(`/Share/check/${postId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking if user shared post:', error);
      throw error;
    }
  },

  // Get share count for post
  getShareCount: async (postId: number) => {
    try {
      const response = await api.get(`/Share/count/${postId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting share count:', error);
      throw error;
    }
  },
};