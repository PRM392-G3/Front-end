import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authAPI, User, AuthResponse, notificationAPI, GoogleLoginResponse, CompleteGoogleRegistrationRequest } from '@/services/api';
import { googleSignInService } from '@/services/googleSignIn'; // Disabled for Expo Go
import { usePostContext } from './PostContext';
import notificationService from '@/services/notificationService';
import signalRService from '@/services/signalRService';
import * as Notifications from 'expo-notifications';
import { handleNotificationNavigation } from '@/utils/notificationNavigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  googleLogin: () => Promise<GoogleLoginResponse>;
  completeGoogleRegistration: (data: CompleteGoogleRegistrationRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearAuthData: () => Promise<void>;
  refreshTokenFromStorage: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingNotifications, setIsInitializingNotifications] = useState(false);
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);
  
  // Get PostContext to clear states on logout
  let postContext: any = null;
  try {
    postContext = usePostContext();
  } catch (error) {
    // PostContext might not be available yet
    console.log('PostContext not available in AuthProvider');
  }

  const isAuthenticated = !!user && !!token;

  /**
   * Khởi tạo notification service
   */
  const initializeNotifications = async (userId: number) => {
    // Prevent duplicate initialization
    if (isInitializingNotifications || notificationListenerRef.current !== null) {
      console.log('AuthContext: Notifications already initialized, skipping...');
      return;
    }
    
    try {
      setIsInitializingNotifications(true);
      console.log('AuthContext: Initializing notifications for user:', userId);

      // Connect to SignalR for real-time chat
      // Commented out temporarily until backend ChatHub is ready
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken && !signalRService.isConnected()) {
          console.log('AuthContext: Attempting to connect to SignalR...');
          
          // Try to connect with timeout
          const connectPromise = signalRService.connect(storedToken);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignalR connection timeout')), 5000)
          );
          
          try {
            await Promise.race([connectPromise, timeoutPromise]);
            console.log('AuthContext: SignalR connected successfully');
          } catch (error) {
            console.warn('AuthContext: SignalR connection failed (will retry later):', error);
            // Don't block other initialization
          }
        }
      } catch (error) {
        console.warn('AuthContext: SignalR connection error (non-critical):', error);
        // Don't block notification initialization if SignalR fails
      }

      // Setup Android channel nếu cần
      await notificationService.setupAndroidChannel();

      // Yêu cầu quyền
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        console.log('AuthContext: Notification permission denied');
        return;
      }

      // Lấy Expo Push Token3
      const expoPushToken = await notificationService.getExpoPushToken();
      if (expoPushToken) {
        // Gửi token lên server
        try {
          const result = await notificationAPI.updateFcmToken(userId, expoPushToken);
          if (result) {
            console.log('AuthContext: FCM token updated on server');
          } else {
            console.warn('AuthContext: FCM token endpoint not available, skipping update');
          }
        } catch (error) {
          // Ignore FCM token errors - không crash app
          console.warn('AuthContext: FCM token update failed (non-critical):', error instanceof Error ? error.message : error);
        }
      }

      // Lắng nghe notification khi app đang mở (foreground)
      const receivedListener = notificationService.onNotificationReceived((notification) => {
        console.log('AuthContext: Notification received:', notification);
        
        // Hiển thị alert hoặc custom notification UI
        const title = notification.request.content.title || 'Thông báo mới';
        const body = notification.request.content.body || '';
        const data = notification.request.content.data;
        
        Alert.alert(
          title,
          body,
          [
            {
              text: 'Xem',
              onPress: () => {
                // Navigate based on notification data
                console.log('Navigate to notification:', data);
                handleNotificationNavigation(data);
              },
            },
            { text: 'Đóng', style: 'cancel' },
          ]
        );
      });
      
      notificationListenerRef.current = receivedListener;

      // Lắng nghe khi user click vào notification
      const responseListener = notificationService.onNotificationResponse((response) => {
        console.log('AuthContext: Notification tapped:', response);
        handleNotificationNavigation(response.notification.request.content.data);
      });
      
      responseListenerRef.current = responseListener;

      // Kiểm tra notification khi mở app từ killed state
      const lastNotification = await notificationService.getLastNotificationResponse();
      if (lastNotification) {
        console.log('AuthContext: App opened from notification:', lastNotification);
        handleNotificationNavigation(lastNotification.notification.request.content.data);
      }

      // Lấy unread count và update badge
      try {
        const unreadCount = await notificationAPI.getUnreadCount(userId);
        await notificationService.setBadgeCount(unreadCount);
      } catch (error) {
        console.error('AuthContext: Failed to get unread count:', error);
      }

    } catch (error) {
      console.error('AuthContext: Error initializing notifications:', error);
    } finally {
      setIsInitializingNotifications(false);
    }
  };


  /**
   * Cleanup notification listeners
   */
  const cleanupNotifications = () => {
    try {
      notificationService.removeListeners();
      notificationListenerRef.current = null;
      responseListenerRef.current = null;
      setIsInitializingNotifications(false);
      console.log('AuthContext: Notification listeners cleaned up');
    } catch (error) {
      console.error('AuthContext: Error cleaning up notification listeners:', error);
    }
  };

  // Kiểm tra trạng thái authentication khi app khởi động
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Checking auth status...');
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      console.log('AuthContext: Stored token exists:', !!storedToken);
      console.log('AuthContext: Stored user exists:', !!storedUser);
      console.log('AuthContext: Stored token length:', storedToken ? storedToken.length : 0);
      console.log('AuthContext: Stored token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'No token');

      // Trong development, có thể force clear auth data
      if (__DEV__ && false) { // Set thành false để không force clear
        console.log('AuthContext: Force clearing auth data in development');
        await clearAuthData();
        return;
      }

      // Trong development, không validate token với server
      // Chỉ kiểm tra xem có token và user data không
      if (storedToken) {
        try {
          let userData;
          
          if (storedUser) {
            // Parse user data để kiểm tra format
            userData = JSON.parse(storedUser);
          } else {
            // If we have token but no user data, decode token to get user info
            console.log('AuthContext: Decoding token to get user data');
            const tokenParts = storedToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userData = {
                id: parseInt(payload.userId),
                email: payload.email,
                fullName: payload.fullname
              };
              await AsyncStorage.setItem('user_data', JSON.stringify(userData));
              console.log('AuthContext: Decoded and saved user data from token');
            }
          }
          
          // Kiểm tra token có format hợp lệ không (ít nhất 10 ký tự)
          if (storedToken.length > 10 && userData && userData.email) {
            console.log('AuthContext: Valid token and user data found');
            console.log('AuthContext: Setting user:', userData.email);
            console.log('AuthContext: Setting token length:', storedToken.length);
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(userData);
            console.log('AuthContext: Authentication state set successfully');
          } else {
            console.log('AuthContext: Invalid token or user data, clearing...');
            console.log('AuthContext: Token length:', storedToken.length);
            if (userData) console.log('AuthContext: User email:', userData.email);
            // Token hoặc user data không hợp lệ, xóa dữ liệu cũ
            await clearAuthData();
          }
        } catch (error) {
          console.error('AuthContext: Error parsing stored user data:', error);
          await clearAuthData();
        }
      } else {
        console.log('AuthContext: No stored token or user data');
        console.log('AuthContext: Token exists:', !!storedToken);
        console.log('AuthContext: User exists:', !!storedUser);
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa tất cả dữ liệu authentication
  const clearAuthData = async () => {
    try {
      console.log('AuthContext: Clearing all auth data...');
      
      // Disconnect SignalR
      try {
        if (signalRService.isConnected()) {
          await signalRService.disconnect();
          console.log('AuthContext: SignalR disconnected');
        }
      } catch (error) {
        console.error('AuthContext: SignalR disconnect error:', error);
      }
      
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data', 'token_expires_at']);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      console.log('AuthContext: Auth data cleared successfully');
    } catch (error) {
      console.error('AuthContext: Error clearing auth data:', error);
    }
  };

  // Đăng nhập
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('AuthContext: Attempting login with:', email);
      
      // Gọi API đăng nhập
      const response = await authAPI.login(email, password);
      
      console.log('AuthContext: API Response:', JSON.stringify(response, null, 2));
      
      // Backend trả về trực tiếp { token, user, expiresAt }
      const authResponse = response as AuthResponse;
      if (authResponse.token && authResponse.user) {
        const { user: userData, token: accessToken, expiresAt } = authResponse;

        console.log('AuthContext: Login successful, saving data...');
        console.log('AuthContext: Token to save:', accessToken ? 'Token exists' : 'No token');
        console.log('AuthContext: Token length:', accessToken ? accessToken.length : 0);

        // Lưu token và user data
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('token_expires_at', expiresAt);

        // Verify token was saved
        const savedToken = await AsyncStorage.getItem('auth_token');
        console.log('AuthContext: Token saved successfully:', savedToken ? 'Yes' : 'No');
        console.log('AuthContext: Saved token length:', savedToken ? savedToken.length : 0);

        setToken(accessToken);
        setRefreshToken(null); // Backend không trả về refresh token
        setUser(userData);
        
        console.log('Login successful:', userData.email);
        
        // Khởi tạo notifications sau khi login thành công
        await initializeNotifications(userData.id);
        
        return true;
      } else {
        console.log('AuthContext: Invalid response structure:', response);
        throw new Error('Response không hợp lệ từ server');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      let code = '';
      if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('|')) {
        [code] = errorMessage.split('|');
      }
      // KHÔNG log lỗi console với bất kỳ lỗi đăng nhập, chỉ throw ra cho UI.
      if (status === 404) {
        throw new Error('Tài khoản không tồn tại. Vui lòng đăng ký tài khoản mới.');
      } else if (status === 401) {
        throw new Error('Email hoặc mật khẩu không đúng.');
      } else if (status === 400) {
        throw new Error('Thông tin đăng nhập không hợp lệ.');
      } else if (error.isNetworkError || error.message === 'Network Error') {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Kiểm tra dữ liệu đầu vào
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Vui lòng điền đầy đủ thông tin');
      }
      
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      
      if (userData.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      }

      // Gọi API đăng ký
      const response = await authAPI.register({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      });
      
      // Backend trả về trực tiếp { token, user, expiresAt }
      const authResponse = response as AuthResponse;
      if (authResponse.token && authResponse.user) {
        const { user: newUser, token: accessToken, expiresAt } = authResponse;

        // Lưu token và user data
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
        await AsyncStorage.setItem('token_expires_at', expiresAt);

        setToken(accessToken);
        setRefreshToken(null); // Backend không trả về refresh token
        setUser(newUser);
        
        console.log('Register successful:', newUser.email);
        
        // Khởi tạo notifications sau khi đăng ký thành công
        await initializeNotifications(newUser.id);
        
        return true;
      } else {
        throw new Error('Response không hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập với Google
  const googleLogin = async (): Promise<GoogleLoginResponse> => {
    try {
      setIsLoading(true);
      
      console.log('AuthContext: Attempting Google login...');
      
      // Import googleSignInService dynamically
      const { googleSignInService } = await import('@/services/googleSignIn');
      
      const googleResult = await googleSignInService.signIn();
      
      console.log('AuthContext: Google result:', {
        hasIdToken: !!googleResult.idToken,
        hasCode: !!(googleResult.user && 'code' in googleResult.user ? googleResult.user.code : undefined),
        user: googleResult.user
      });
      
      // Check if mobile flow (has code)
      if (googleResult.user && 'code' in googleResult.user && googleResult.user.code) {
        console.log('AuthContext: Mobile flow - sending code to backend...');
        
        // Mobile: send code to backend exchange endpoint
        const { getAPIUrl, API_CONFIG } = await import('@/config/api');
        const apiUrl = getAPIUrl();
        
        // Get redirect URI used in OAuth (Expo Go)
        const redirectUri = 'https://auth.expo.io/@minhtri10504/nexora-app';
        
        console.log('[AuthContext] Mobile flow - using redirect URI:', redirectUri);
        
        const response = await fetch(`${apiUrl}/GoogleOAuth/exchange-code`, {
          method: 'POST',
          headers: API_CONFIG.HEADERS,
          body: JSON.stringify({
            code: 'code' in googleResult.user ? googleResult.user.code : '',
            redirectUri
          }),
        });
        
        const responseText = await response.text();
        if (!response.ok) {
          throw new Error(`Backend error: ${responseText}`);
        }
        
        const data = JSON.parse(responseText);
        console.log('AuthContext: Exchange response:', data);
        
        if (data.token) {
          await AsyncStorage.setItem('auth_token', data.token);
          if (data.user) {
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
          }
          await refreshTokenFromStorage();
          console.log('Mobile Google login successful');
          return {
            token: data.token,
            isNewUser: false,
            email: null,
            fullName: null,
            avatarUrl: null,
            googleId: null,
            message: 'Login successful'
          };
        } else if (data.isNewUser) {
          console.log('Mobile: New user, returning data:', {
            email: data.email,
            googleId: data.googleId,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl
          });
          return {
            isNewUser: true,
            token: null,
            email: data.email,
            googleId: data.googleId,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            message: 'New user needs registration'
          };
        } else {
          throw new Error('Invalid response from backend');
        }
      } 
      // Web flow (has idToken)
      else if (googleResult.idToken) {
        console.log('AuthContext: Web flow - calling API with idToken...');
        
        const response = await authAPI.googleLogin(googleResult.idToken);
        
        console.log('AuthContext: Google API Response:', JSON.stringify(response, null, 2));
        
        // Kiểm tra nếu là user mới (cần nhập password)
        if (response.isNewUser) {
          console.log('AuthContext: New Google user, need to complete registration');
          return response;
        }
        
        // User đã tồn tại - login thành công
        if (response.token) {
          await AsyncStorage.setItem('auth_token', response.token);
          setToken(response.token);
          
          // Try to extract user info from JWT or fetch from API
          try {
            await refreshTokenFromStorage();
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
          
          console.log('Google login successful for existing user');
          return response;
        } else {
          throw new Error('Google login response không hợp lệ');
        }
      } else {
        throw new Error('Không thể lấy Google token hoặc code');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.message?.includes('OAuth error')) {
        Alert.alert('Lỗi OAuth', 'Có lỗi xảy ra trong quá trình xác thực Google. Vui lòng thử lại.');
      } else if (error.message?.includes('cancelled')) {
        console.log('Google login cancelled by user');
        // Không hiển thị alert cho trường hợp user cancel
      } else if (error.message?.includes('invalid request')) {
        Alert.alert('Lỗi cấu hình', 'Cấu hình Google OAuth không đúng. Vui lòng liên hệ admin.');
      } else {
        Alert.alert('Lỗi đăng nhập Google', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Hoàn tất đăng ký Google (cho user mới)
  const completeGoogleRegistration = async (data: CompleteGoogleRegistrationRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('AuthContext: Completing Google registration for:', data.email);
      
      const response = await authAPI.completeGoogleRegistration(data);
      
      console.log('AuthContext: Complete registration response:', JSON.stringify(response, null, 2));
      
      if (response.token) {
        const accessToken = response.token;
        
        console.log('AuthContext: Saving token to storage');

        // Lưu token
        await AsyncStorage.setItem('auth_token', accessToken);

        setToken(accessToken);
        setRefreshToken(null);
        
        // Decode token to get user info
        console.log('AuthContext: Decoding token');
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userId = payload.userId;
          const email = payload.email;
          const fullname = payload.fullname;
          
          console.log('AuthContext: Decoded user ID:', userId);
          
          // Create user object from token payload
          const userData = {
            id: parseInt(userId),
            email: email,
            fullName: fullname,
            coverImageUrl: null,
            avatarUrl: null,
            phoneNumber: '',
            bio: null,
            dateOfBirth: null,
            location: null,
            isActive: true,
            emailVerifiedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isFollowing: false
          };
          
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
          
          console.log('Complete Google registration successful:', userData.email);
          
          // Khởi tạo notifications sau khi đăng ký hoàn tất
          await initializeNotifications(userData.id);
        }
        
        return true;
      } else {
        throw new Error('Complete registration response không hợp lệ: thiếu token');
      }
    } catch (error: any) {
      console.error('Complete Google registration error:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Có lỗi xảy ra khi hoàn tất đăng ký';
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Google Sign-In disabled in Expo Go
      console.log('Google Sign-Out disabled in Expo Go');
      
      // Cleanup notifications
      cleanupNotifications();
      await notificationService.clearAll();
      
      // Clear PostContext states
      if (postContext?.clearStates) {
        await postContext.clearStates();
      }
      
      // Xóa tất cả dữ liệu authentication
      await clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh token từ AsyncStorage
  const refreshTokenFromStorage = async () => {
    try {
      console.log('AuthContext: Refreshing token from storage...');
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        console.log('AuthContext: Token refreshed from storage successfully');
      } else {
        console.log('AuthContext: No token or user data found in storage');
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing token from storage:', error);
    }
  };

  // Kiểm tra auth status khi component mount
  useEffect(() => {
    checkAuthStatus();
    
    // Cleanup khi unmount
    return () => {
      cleanupNotifications();
    };
  }, []);

  // Khởi tạo notifications khi user đã có sẵn (sau khi restore session)
  useEffect(() => {
    // Prevent duplicate initialization
    if (!user || !token || isLoading || isInitializingNotifications) {
      return;
    }
    
    let isMounted = true;
    
    const initNotifications = async () => {
      if (isMounted && notificationListenerRef.current === null) {
        console.log('AuthContext: User restored, initializing notifications...');
        await initializeNotifications(user.id);
      }
    };
    
    initNotifications();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, !!token, isLoading]);

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    googleLogin,
    completeGoogleRegistration,
    logout,
    checkAuthStatus,
    clearAuthData,
    refreshTokenFromStorage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
