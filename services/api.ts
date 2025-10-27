import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getAPIUrl } from '../config/api';

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

// Group interfaces
export interface Group {
  id: number;
  name: string;
  description: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  createdById: number;
  privacy: 'private' | 'public';
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  createdById: number;
  privacy: 'private' | 'public';
}

export interface GroupInviteRequest {
  groupId: number;
  userId: number;
  invitedById: number;
  role: 'member' | 'admin';
}

export interface GroupInviteResponse {
  id: number;
  groupId: number;
  userId: number;
  invitedById: number;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  group: Group;
  user: User;
  invitedByUser: User;
}

export interface GroupInvitation {
  id: number;
  groupId: number;
  userId: number;
  invitedById: number;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'rejected';
  invitationType: 'invitation' | 'request'; // invitation: admin/member mời, request: user tự xin vào
  createdAt: string;
  updatedAt: string;
  group: Group;
  user?: User; // User được mời hoặc user xin vào
  invitedByUser: User; // Người mời hoặc người xin vào
}

// Auth response interface
export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// Google Login Response
export interface GoogleLoginResponse {
  isNewUser: boolean;
  token: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  message: string;
}

// Complete Google Registration Request
export interface CompleteGoogleRegistrationRequest {
  email: string;
  googleId: string;
  password: string;
  fullName: string;
  avatarUrl?: string;
}

// Cấu hình axios instance
const BASE_URL = getAPIUrl();
console.log('[API] Initializing with baseURL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
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
      return response.data as AuthResponse;
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
      return response.data as AuthResponse;
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
      return response.data as GoogleLoginResponse;
    } catch (error) {
      throw error;
    }
  },

  // Hoàn tất đăng ký Google (cho user mới)
  completeGoogleRegistration: async (data: CompleteGoogleRegistrationRequest) => {
    try {
      console.log('authAPI: Full request data:', JSON.stringify(data, null, 2));
      console.log('authAPI: Completing Google registration:', data.email);
      const response = await api.post('/Auth/complete-google-registration', {
        email: data.email,
        googleId: data.googleId,
        password: data.password,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
      });
      console.log('authAPI: Response received:', JSON.stringify(response.data, null, 2));
      return response.data as AuthResponse;
    } catch (error: any) {
      console.error('authAPI: Error completing Google registration:', error);
      console.error('authAPI: Error response data:', error.response?.data);
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
      return response.data as AuthResponse;
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

  // ✅ OPTIMIZED: Get lightweight user profile (fast loading)
  getUserProfile: async (userId: number) => {
    try {
      console.log('[userAPI] Getting user profile:', userId);
      const response = await api.get(`/User/${userId}/profile`);
      console.log('[userAPI] Profile response:', response.data);
      return response.data as User;
    } catch (error: any) {
      console.error('[userAPI] Error getting user profile:', error.response?.data);
      throw error;
    }
  },

  // Hủy theo dõi một user
  // followerId: ID của người đang follow (user hiện tại)
  // followingId: ID của người được follow (sẽ bị hủy follow)
  unfollowUser: async (followerId: number, followingId: number) => {
    try {
      const response = await api.delete(`/User/${followerId}/follow/${followingId}`);
      return response.data as Group;
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
      return response.data as Group;
    } catch (error) {
      throw error;
    }
  },

  // Tìm kiếm người dùng
  searchUsers: async (query: string, page: number = 1, limit: number = 20) => {
    try {
      const response = await api.get(`/User/search?name=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data as Group;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách followers của user
  getFollowersList: async (userId: number) => {
    try {
      const response = await api.get(`/User/${userId}/followers`);
      return response.data as Group;
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
      return response.data as Group;
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
  postId?: number;
  reelId?: number;
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
  groupId?: number; // Optional: for posting in a group
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
  // For group posts
  groupId?: number; // ID of the group this post belongs to
  group?: Group; // Group information if this is a group post
}

// ✅ Lightweight Feed DTO - only metadata, no nested objects
export interface PostFeedResponse {
  // Basic post info
  id: number;
  userId: number;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  groupId?: number | null;
  groupName?: string | null;
  isPublic: boolean;
  
  // Basic user info (only name & avatar)
  userName: string;
  userAvatar?: string | null;
  
  // Counts only - NO nested arrays
  likeCount: number;
  commentCount: number;
  shareCount: number;
  
  // Status flags
  isLiked: boolean;
  isShared: boolean;
  
  // Tags (only names)
  tagNames: string[];
}

// Reel interfaces
export interface ReelMusic {
  id: number;
  title: string;
  artist?: string;
  musicUrl: string;
  duration?: number;
  coverImageUrl?: string;
  createdAt: string;
}

export interface ReelResponse {
  id: number;
  userId: number;
  videoUrl: string;
  videoFileName?: string;
  caption?: string;
  musicId?: number;
  musicUrl?: string;
  musicFileName?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicDuration: number;
  duration: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isPublic: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  music?: ReelMusic;
  isLiked?: boolean; // Added to check if current user liked this reel
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

  // Get all posts with like status for current user
  getAllPostsWithLikes: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get(`/Post/with-likes?page=${page}&pageSize=${pageSize}`);
      return response.data as PostResponse[];
    } catch (error) {
      throw error;
    }
  },

  // ✅ OPTIMIZED: Get posts with metadata only (no N+1 queries)
  // Comments lazy loaded when user taps
  getOptimizedFeed: async (page = 1, pageSize = 20) => {
    try {
      console.log('[postAPI] Fetching optimized feed:', { page, pageSize });
      const response = await api.get(`/Post/optimized-feed`, {
        params: { page, pageSize }
      });
      const data = response.data as any;
      const posts = data?.posts || data || [];
      console.log('[postAPI] Optimized feed response:', posts.length, 'posts');
      return Array.isArray(posts) ? posts as PostFeedResponse[] : [];
    } catch (error: any) {
      console.error('[postAPI] Error fetching optimized feed:', error);
      throw error;
    }
  },
  
  // Get posts without like status (for public access)
  getAllPosts: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get(`/Post?page=${page}&pageSize=${pageSize}`);
      return response.data as { posts: PostResponse[], currentPage: number, pageSize: number, hasMore: boolean };
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
      console.log('[postAPI] Liking post:', { postId, userId });
      const response = await api.post(`/Post/${postId}/like/${userId}`);
      console.log('[postAPI] Like response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[postAPI] Error liking post:', error.response?.data);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId: number, userId: number) => {
    try {
      console.log('[postAPI] Unliking post:', { postId, userId });
      const response = await api.delete(`/Post/${postId}/like/${userId}`);
      console.log('[postAPI] Unlike response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[postAPI] Error unliking post:', error.response?.data);
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
  createComment: async (data: { postId?: number; reelId?: number; content: string; userId: number }) => {
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

  // Get comments for a reel
  getCommentsByReel: async (reelId: number) => {
    try {
      const response = await api.get(`/Comment/reel/${reelId}`);
      return response.data as Comment[];
    } catch (error) {
      console.error('Error getting reel comments:', error);
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
      return response.data as Group;
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
      return response.data as Group;
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
      
      return response.data as Group;
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
      return response.data as Group;
    } catch (error: any) {
      console.error('Error getting shares by post:', error);
      throw error;
    }
  },

  // Get shares by user
  getSharesByUser: async (userId: number) => {
    try {
      const response = await api.get(`/Share/user/${userId}`);
      return response.data as Group;
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
      return response.data as Group;
    } catch (error: any) {
      console.error('Error getting share count:', error);
      throw error;
    }
  },
};

// Notification interfaces
export interface Notification {
  id: number;
  userId: number;
  fromUserId: number;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'MESSAGE' | 
        'GROUP_JOIN_REQUEST' | 'GROUP_JOIN_APPROVED' | 'GROUP_INVITATION' |
        'POST_SHARE' | 'REEL_LIKE' | 'REEL_COMMENT';
  title: string;
  message: string;
  postId?: number;
  commentId?: number;
  groupId?: number;
  reelId?: number;
  isRead: boolean;
  createdAt: string;
  fromUser?: User;
}

export interface NotificationSettings {
  userId: number;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableLikeNotifications: boolean;
  enableCommentNotifications: boolean;
  enableFriendRequestNotifications: boolean;
  enableMessageNotifications: boolean;
  enableGroupNotifications: boolean;
}

// Notification API endpoints
export const notificationAPI = {
  /**
   * Cập nhật FCM Token lên server
   */
  updateFcmToken: async (userId: number, fcmToken: string) => {
    try {
      console.log('notificationAPI: Updating FCM token for user:', userId);
      const response = await api.put(`/User/${userId}/fcm-token`, {
        fcmToken: fcmToken,
      });
      console.log('notificationAPI: FCM token updated successfully');
      return response.data;
    } catch (error: any) {
      // 404 có thể do endpoint chưa được implement - không crash app
      if (error.response?.status === 404) {
        console.warn('notificationAPI: FCM token endpoint not found (404) - ignoring gracefully');
        return null;
      }
      
      console.error('notificationAPI: Error updating FCM token:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        console.warn('notificationAPI: Network error when updating FCM token - ignoring gracefully');
        return null;
      }
      
      // Ignore other errors gracefully
      console.warn('notificationAPI: Failed to update FCM token, but continuing without error');
      return null;
    }
  },

  /**
   * Lấy tất cả notifications của user
   */
  getNotifications: async (userId: number): Promise<Notification[]> => {
    try {
      console.log('notificationAPI: Getting notifications for user:', userId);
      const response = await api.get(`/Notification/user/${userId}`);
      return response.data as Notification[];
    } catch (error: any) {
      console.error('notificationAPI: Error getting notifications:', error);
      
      if (error.response?.status === 404) {
        return []; // Không có notification
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        console.warn('notificationAPI: Network error, returning empty array');
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Lấy notifications chưa đọc
   */
  getUnreadNotifications: async (userId: number): Promise<Notification[]> => {
    try {
      console.log('notificationAPI: Getting unread notifications for user:', userId);
      const response = await api.get(`/Notification/user/${userId}/unread`);
      return response.data as Notification[];
    } catch (error: any) {
      console.error('notificationAPI: Error getting unread notifications:', error);
      
      if (error.response?.status === 404) {
        return [];
      } else if (error.isNetworkError) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Lấy số lượng notifications chưa đọc
   */
  getUnreadCount: async (userId: number): Promise<number> => {
    try {
      console.log('notificationAPI: Getting unread count for user:', userId);
      const response = await api.get(`/Notification/user/${userId}/unread-count`);
      return (response.data as { count?: number }).count || 0;
    } catch (error: any) {
      console.error('notificationAPI: Error getting unread count:', error);
      
      if (error.response?.status === 404) {
        return 0;
      } else if (error.isNetworkError) {
        return 0;
      }
      
      return 0;
    }
  },

  /**
   * Đánh dấu notification đã đọc
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      console.log('notificationAPI: Marking notification as read:', notificationId);
      await api.put(`/Notification/${notificationId}/mark-read`);
      console.log('notificationAPI: Notification marked as read');
    } catch (error: any) {
      console.error('notificationAPI: Error marking notification as read:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Thông báo không tồn tại');
      }
      
      throw error;
    }
  },

  /**
   * Đánh dấu tất cả notifications đã đọc
   */
  markAllAsRead: async (userId: number): Promise<void> => {
    try {
      console.log('notificationAPI: Marking all notifications as read for user:', userId);
      await api.put(`/Notification/user/${userId}/mark-all-read`);
      console.log('notificationAPI: All notifications marked as read');
    } catch (error: any) {
      console.error('notificationAPI: Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Xóa notification
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      console.log('notificationAPI: Deleting notification:', notificationId);
      await api.delete(`/Notification/${notificationId}`);
      console.log('notificationAPI: Notification deleted');
    } catch (error: any) {
      console.error('notificationAPI: Error deleting notification:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Thông báo không tồn tại');
      }
      
      throw error;
    }
  },

  /**
   * Xóa tất cả notifications
   */
  deleteAllNotifications: async (userId: number): Promise<void> => {
    try {
      console.log('notificationAPI: Deleting all notifications for user:', userId);
      await api.delete(`/Notification/user/${userId}/all`);
      console.log('notificationAPI: All notifications deleted');
    } catch (error: any) {
      console.error('notificationAPI: Error deleting all notifications:', error);
      throw error;
    }
  },

  /**
   * Lấy cài đặt notification của user
   */
  getNotificationSettings: async (userId: number): Promise<NotificationSettings> => {
    try {
      console.log('notificationAPI: Getting notification settings for user:', userId);
      const response = await api.get(`/Notification/user/${userId}/settings`);
      return response.data as NotificationSettings;
    } catch (error: any) {
      console.error('notificationAPI: Error getting notification settings:', error);
      
      // Trả về settings mặc định nếu chưa có
      if (error.response?.status === 404) {
        return {
          userId,
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableLikeNotifications: true,
          enableCommentNotifications: true,
          enableFriendRequestNotifications: true,
          enableMessageNotifications: true,
          enableGroupNotifications: true,
        };
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật cài đặt notification
   */
  updateNotificationSettings: async (
    userId: number,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    try {
      console.log('notificationAPI: Updating notification settings for user:', userId);
      const response = await api.put(`/Notification/user/${userId}/settings`, settings);
      return response.data as NotificationSettings;
    } catch (error: any) {
      console.error('notificationAPI: Error updating notification settings:', error);
      throw error;
    }
  },
};

// Group API
export const groupAPI = {
  // Tạo nhóm mới
  createGroup: async (groupData: CreateGroupRequest): Promise<Group> => {
    try {
      console.log('groupAPI: Creating group:', groupData);
      
      const response = await api.post('/Group', groupData);
      console.log('groupAPI: Create group response:', response.status);
      
      return response.data as Group;
    } catch (error: any) {
      console.error('groupAPI: Error creating group:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Dữ liệu nhóm không hợp lệ');
        }
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể tạo nhóm. Vui lòng thử lại.');
      }
    }
  },

  // Lấy danh sách nhóm của người dùng
  getUserGroups: async (userId: number): Promise<Group[]> => {
    try {
      console.log('groupAPI: Getting user groups for user:', userId);
      
      const response = await api.get(`/Group/user/${userId}`);
      console.log('groupAPI: Get user groups response:', response.status);
      
      return response.data as Group[];
    } catch (error: any) {
      console.error('groupAPI: Error getting user groups:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 404) {
        return []; // Return empty array if no groups found
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể lấy danh sách nhóm. Vui lòng thử lại.');
      }
    }
  },

  // Lấy danh sách nhóm công khai (khám phá)
  getPublicGroups: async (): Promise<Group[]> => {
    try {
      console.log('groupAPI: Getting public groups');
      
      const response = await api.get('/Group/public');
      console.log('groupAPI: Get public groups response:', response.status);
      
      return response.data as Group[];
    } catch (error: any) {
      console.error('groupAPI: Error getting public groups:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 404) {
        return []; // Return empty array if no groups found
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể lấy danh sách nhóm. Vui lòng thử lại.');
      }
    }
  },

  // Lấy chi tiết nhóm
  getGroupById: async (groupId: number): Promise<Group> => {
    try {
      console.log('groupAPI: Getting group by id:', groupId);
      
      const response = await api.get(`/Group/${groupId}`);
      console.log('groupAPI: Get group response:', response.status);
      
      return response.data as Group;
    } catch (error: any) {
      console.error('groupAPI: Error getting group:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Nhóm không tồn tại');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể lấy thông tin nhóm. Vui lòng thử lại.');
      }
    }
  },

  // Mời thành viên vào nhóm
  inviteToGroup: async (inviteData: GroupInviteRequest): Promise<GroupInviteResponse> => {
    try {
      console.log('groupAPI: Inviting user to group:', inviteData);
      
      const response = await api.post('/Group/invite', inviteData);
      console.log('groupAPI: Invite response:', response.status);
      
      return response.data as GroupInviteResponse;
    } catch (error: any) {
      console.error('groupAPI: Error inviting to group:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Không thể gửi lời mời');
        }
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 404) {
        throw new Error('Nhóm hoặc người dùng không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể gửi lời mời. Vui lòng thử lại.');
      }
    }
  },

  // Rời nhóm
  leaveGroup: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Leaving group:', { groupId, userId });
      
      // userId là query parameter, không phải body
      const response = await api.post(`/Group/${groupId}/leave?userId=${userId}`);
      console.log('groupAPI: Leave group response:', response.status);
      console.log('groupAPI: Leave group message:', response.data);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error leaving group:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Không thể rời nhóm');
        }
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 404) {
        throw new Error('Nhóm không tồn tại hoặc bạn không phải thành viên');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể rời nhóm. Vui lòng thử lại.');
      }
    }
  },

  // Kiểm tra user có phải thành viên của nhóm không
  checkMembership: async (groupId: number, userId: number): Promise<boolean> => {
    try {
      console.log('groupAPI: Checking membership:', { groupId, userId });
      
      const response = await api.get<{ isMember: boolean }>(`/Group/${groupId}/is-member/${userId}`);
      console.log('groupAPI: Check membership response:', response.status);
      console.log('groupAPI: isMember:', response.data.isMember);
      
      return response.data.isMember;
    } catch (error: any) {
      console.error('groupAPI: Error checking membership:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      // If there's an error, assume not a member
      if (error.response?.status === 404) {
        return false;
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        console.warn('groupAPI: Network error when checking membership, returning false');
        return false;
      } else {
        // For other errors, return false instead of throwing
        console.warn('groupAPI: Unknown error when checking membership, returning false');
        return false;
      }
    }
  },

  // Chấp nhận lời mời tham gia nhóm
  acceptInvitation: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Accepting invitation:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/accept-invitation?userId=${userId}`);
      console.log('groupAPI: Accept invitation response:', response.status);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error accepting invitation:', error);
      console.error('groupAPI: Error status:', error.response?.status);
      console.error('groupAPI: Error message:', error.message);
      console.error('groupAPI: Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        throw new Error('Không thể chấp nhận lời mời');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 404) {
        throw new Error('Lời mời không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể chấp nhận lời mời. Vui lòng thử lại.');
      }
    }
  },


  // Tìm kiếm nhóm theo tên
  searchGroups: async (name: string): Promise<Group[]> => {
    try {
      console.log('groupAPI: Searching groups with name:', name);
      
      const response = await api.get(`/Group/search?name=${encodeURIComponent(name)}`);
      console.log('groupAPI: Search groups response:', response.status);
      
      return response.data as Group[];
    } catch (error: any) {
      console.error('groupAPI: Error searching groups:', error);
      
      if (error.response?.status === 404) {
        return [];
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        return [];
      } else {
        return [];
      }
    }
  },

  // Lấy danh sách lời mời nhóm pending của user (tất cả groups mời user này)
  getPendingInvitationsForUser: async (userId: number): Promise<GroupInvitation[]> => {
    try {
      console.log('groupAPI: Getting pending invitations for user:', userId);
      
      // TODO: Need backend API endpoint to get all invitations for a user
      // For now, return empty array
      console.warn('groupAPI: getPendingInvitationsForUser not implemented on backend yet');
      return [];
    } catch (error: any) {
      console.error('groupAPI: Error getting pending invitations for user:', error);
      return [];
    }
  },

  // Lấy danh sách lời mời pending của một group
  getGroupPendingInvitations: async (groupId: number): Promise<GroupInvitation[]> => {
    try {
      console.log('groupAPI: Getting pending invitations for group:', groupId);
      
      const response = await api.get(`/Group/${groupId}/invitations/pending`);
      console.log('groupAPI: Pending invitations response:', response.status);
      
      return response.data as GroupInvitation[];
    } catch (error: any) {
      console.error('groupAPI: Error getting pending invitations:', error);
      
      if (error.response?.status === 404) {
        return [];
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        return [];
      } else {
        return [];
      }
    }
  },

  // Request để tham gia nhóm (user tự xin vào)
  requestToJoinGroup: async (groupId: number, userId: number): Promise<GroupInviteResponse> => {
    try {
      console.log('groupAPI: Requesting to join group:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/request-join`, {
        groupId,
        userId,
        role: 'member'
      });
      console.log('groupAPI: Request to join response:', response.status);
      
      return response.data as GroupInviteResponse;
    } catch (error: any) {
      console.error('groupAPI: Error requesting to join group:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Không thể gửi yêu cầu tham gia');
        }
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 404) {
        throw new Error('Nhóm không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại.');
      }
    }
  },

  // Lấy danh sách pending requests (user xin vào trực tiếp) - cho admin
  getGroupPendingRequests: async (groupId: number): Promise<GroupInvitation[]> => {
    try {
      console.log('groupAPI: Getting pending requests for group:', groupId);
      
      const response = await api.get(`/Group/${groupId}/join-requests/pending`);
      console.log('groupAPI: Pending requests response:', response.status);
      
      return response.data as GroupInvitation[];
    } catch (error: any) {
      console.error('groupAPI: Error getting pending requests:', error);
      
      if (error.response?.status === 404) {
        return [];
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        return [];
      } else {
        return [];
      }
    }
  },

  // Kiểm tra trạng thái join của user với group
  getGroupJoinStatus: async (groupId: number, userId: number): Promise<{
    groupId: number;
    userId: number;
    status: 'pending' | 'accepted' | 'rejected' | 'not_requested';
  }> => {
    try {
      console.log('groupAPI: Getting join status for group:', groupId, 'user:', userId);
      
      const response = await api.get(`/Group/${groupId}/join-status?userId=${userId}`);
      console.log('groupAPI: Join status response:', response.status);
      
      return response.data as {
        groupId: number;
        userId: number;
        status: 'pending' | 'accepted' | 'rejected' | 'not_requested';
      };
    } catch (error: any) {
      console.error('groupAPI: Error getting join status:', error);
      
      if (error.response?.status === 404) {
        return {
          groupId,
          userId,
          status: 'not_requested'
        };
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.isNetworkError) {
        return {
          groupId,
          userId,
          status: 'not_requested'
        };
      } else {
        return {
          groupId,
          userId,
          status: 'not_requested'
        };
      }
    }
  },

  // Duyệt request (user xin vào trực tiếp) - cho admin
  approveRequest: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Approving request:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/approve-request/${userId}`);
      console.log('groupAPI: Approve response:', response.status);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error approving request:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Không thể duyệt yêu cầu');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền duyệt yêu cầu');
      } else if (error.response?.status === 404) {
        throw new Error('Yêu cầu không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể duyệt yêu cầu. Vui lòng thử lại.');
      }
    }
  },

  // Từ chối request (user xin vào trực tiếp) - cho admin
  rejectRequest: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Rejecting request:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/reject-request/${userId}`);
      console.log('groupAPI: Reject response:', response.status);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error rejecting request:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Không thể từ chối yêu cầu');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền từ chối yêu cầu');
      } else if (error.response?.status === 404) {
        throw new Error('Yêu cầu không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể từ chối yêu cầu. Vui lòng thử lại.');
      }
    }
  },

  // Duyệt invitation (user được mời bởi member) - cho admin
  approveInvitation: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Approving invitation:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/approve-invitation/${userId}`);
      console.log('groupAPI: Approve invitation response:', response.status);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error approving invitation:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Không thể duyệt lời mời');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền duyệt lời mời');
      } else if (error.response?.status === 404) {
        throw new Error('Lời mời không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể duyệt lời mời. Vui lòng thử lại.');
      }
    }
  },

  // Từ chối invitation (user được mời bởi member) - cho admin
  rejectInvitation: async (groupId: number, userId: number): Promise<void> => {
    try {
      console.log('groupAPI: Rejecting invitation:', { groupId, userId });
      
      const response = await api.post(`/Group/${groupId}/reject-invitation/${userId}`);
      console.log('groupAPI: Reject invitation response:', response.status);
      
      return;
    } catch (error: any) {
      console.error('groupAPI: Error rejecting invitation:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Không thể từ chối lời mời');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền từ chối lời mời');
      } else if (error.response?.status === 404) {
        throw new Error('Lời mời không tồn tại');
      } else if (error.isNetworkError) {
        throw new Error('Lỗi kết nối mạng. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể từ chối lời mời. Vui lòng thử lại.');
      }
    }
  },

  // Kiểm tra role của user trong group (sử dụng logic đơn giản)
  getUserRoleInGroup: async (groupId: number, userId: number): Promise<{ role: 'admin' | 'member' | null }> => {
    try {
      console.log('groupAPI: Getting user role in group:', { groupId, userId });
      
      // Lấy thông tin group để check createdById
      const groupData = await groupAPI.getGroupById(groupId);
      
      // Nếu user là người tạo group thì là admin
      if (groupData.createdById === userId) {
        return { role: 'admin' };
      }
      
      // Nếu user là member (đã check qua checkMembership) thì là member
      const isMember = await groupAPI.checkMembership(groupId, userId);
      if (isMember) {
        return { role: 'member' };
      }
      
      return { role: null };
    } catch (error: any) {
      console.error('groupAPI: Error getting user role:', error);
      return { role: null };
    }
  },

  // Kiểm tra trạng thái của user với group (sử dụng các API có sẵn)
  checkUserGroupStatus: async (groupId: number, userId: number): Promise<{
    isMember: boolean;
    hasPendingRequest: boolean;
    hasPendingInvitation: boolean;
    role?: 'admin' | 'member';
  }> => {
    try {
      console.log('groupAPI: Checking user group status:', { groupId, userId });
      
      // Sử dụng các API có sẵn để kiểm tra
      const [membershipResult, roleResult] = await Promise.allSettled([
        groupAPI.checkMembership(groupId, userId),
        groupAPI.getUserRoleInGroup(groupId, userId)
      ]);
      
      const isMember = membershipResult.status === 'fulfilled' ? membershipResult.value : false;
      const role = roleResult.status === 'fulfilled' ? roleResult.value.role : null;
      
      // TODO: Cần backend API để check pending request/invitation
      // Tạm thời return false cho các trạng thái này
      const hasPendingRequest = false;
      const hasPendingInvitation = false;
      
      console.log('groupAPI: User group status result:', {
        isMember,
        hasPendingRequest,
        hasPendingInvitation,
        role
      });
      
      return {
        isMember,
        hasPendingRequest,
        hasPendingInvitation,
        role: role || undefined
      };
    } catch (error: any) {
      console.error('groupAPI: Error checking user group status:', error);
      
      return {
        isMember: false,
        hasPendingRequest: false,
        hasPendingInvitation: false
      };
    }
  },

  // Tạo bài viết trong nhóm
  createGroupPost: async (groupId: number, postData: CreatePostRequest): Promise<PostResponse> => {
    try {
      console.log('groupAPI: Creating post in group:', groupId, postData);
      
      const dataWithGroup = {
        ...postData,
        groupId: groupId
      };
      
      const response = await api.post('/Post', dataWithGroup);
      console.log('groupAPI: Create group post response:', response.status);
      
      return response.data as PostResponse;
    } catch (error: any) {
      console.error('groupAPI: Error creating group post:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu bài viết không hợp lệ');
      } else if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền đăng bài trong nhóm này');
      } else {
        throw new Error('Không thể tạo bài viết. Vui lòng thử lại.');
      }
    }
  },

  // Lấy tất cả bài viết trong nhóm
  getGroupPosts: async (groupId: number): Promise<PostResponse[]> => {
    try {
      console.log('groupAPI: Getting posts for group:', groupId);
      
      const response = await api.get(`/Group/${groupId}/posts`);
      console.log('groupAPI: Get group posts response:', response.status);
      
      return response.data as PostResponse[];
    } catch (error: any) {
      console.error('groupAPI: Error getting group posts:', error);
      
      if (error.response?.status === 404) {
        return []; // Return empty array if no posts found
      } else {
        throw new Error('Không thể tải bài viết của nhóm');
      }
    }
  },

  // Lấy bài viết trong nhóm với trạng thái like của user hiện tại
  getGroupPostsWithLikes: async (groupId: number): Promise<PostResponse[]> => {
    try {
      console.log('groupAPI: Getting posts with likes for group:', groupId);
      
      const response = await api.get(`/Group/${groupId}/posts/with-likes`);
      console.log('groupAPI: Get group posts with likes response:', response.status);
      
      return response.data as PostResponse[];
    } catch (error: any) {
      console.error('groupAPI: Error getting group posts with likes:', error);
      
      if (error.response?.status === 404) {
        // Fallback to regular posts if with-likes endpoint doesn't exist
        return await groupAPI.getGroupPosts(groupId);
      } else {
        throw new Error('Không thể tải bài viết của nhóm');
      }
    }
  }
};

// Reels API functions
export const reelAPI = {
  // Create a new reel
  createReel: async (data: {
    userId: number;
    videoUrl: string;
    caption?: string;
    musicId?: number;
    isPublic?: boolean;
  }) => {
    try {
      const response = await api.post('/Reel', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating reel:', error);
      throw error;
    }
  },

  // Get a reel by ID
  getReelById: async (reelId: number) => {
    try {
      const response = await api.get(`/Reel/${reelId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting reel:', error);
      throw error;
    }
  },

  // Get all reels
  getAllReels: async () => {
    try {
      const response = await api.get('/Reel');
      return response.data;
    } catch (error: any) {
      console.error('Error getting all reels:', error);
      throw error;
    }
  },

  // Get reels by user
  getReelsByUser: async (userId: number) => {
    try {
      const response = await api.get(`/Reel/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting user reels:', error);
      throw error;
    }
  },

        // Update a reel
        updateReel: async (reelId: number, data: {
          caption?: string;
          isPublic?: boolean;
          videoUrl?: string;
          videoFileName?: string;
          musicId?: number;
          musicUrl?: string;
          musicFileName?: string;
          musicTitle?: string;
          musicArtist?: string;
          musicDuration?: number;
          duration?: number;
        }) => {
          try {
            const response = await api.put(`/Reel/${reelId}`, data);
            return response.data;
          } catch (error: any) {
            console.error('Error updating reel:', error);
            throw error;
          }
        },

  // Delete a reel
  deleteReel: async (reelId: number) => {
    try {
      const response = await api.delete(`/Reel/${reelId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting reel:', error);
      throw error;
    }
  },

  // Like a reel
  likeReel: async (reelId: number, userId: number) => {
    try {
      const response = await api.post(`/Reel/${reelId}/like/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error liking reel:', error);
      throw error;
    }
  },

  // Unlike a reel
  unlikeReel: async (reelId: number, userId: number) => {
    try {
      const response = await api.delete(`/Reel/${reelId}/like/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error unliking reel:', error);
      throw error;
    }
  },

  // Get all music for reels
  getAllReelMusic: async () => {
    try {
      const response = await api.get('/Reel/music');
      return response.data;
    } catch (error: any) {
      console.error('Error getting reel music:', error);
      throw error;
    }
  },

  // Get music by ID
  getReelMusicById: async (musicId: number) => {
    try {
      const response = await api.get(`/Reel/music/${musicId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting reel music:', error);
      throw error;
    }
  },

  // Create music for reels
  createReelMusic: async (data: {
    title: string;
    artist?: string;
    musicUrl: string;
    duration?: number;
    coverImageUrl?: string;
  }) => {
    try {
      const response = await api.post('/Reel/music', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating reel music:', error);
      throw error;
    }
  },
};

// Main API object that combines all APIs
export const API = {
  ...authAPI,
  ...userAPI,
  ...postAPI,
  ...commentAPI,
  ...tagAPI,
  ...shareAPI,
  ...reelAPI,
  
  // Direct access to reel methods
  getReelById: reelAPI.getReelById,
  updateReel: reelAPI.updateReel,
  deleteReel: reelAPI.deleteReel,
  likeReel: reelAPI.likeReel,
  unlikeReel: reelAPI.unlikeReel,
};