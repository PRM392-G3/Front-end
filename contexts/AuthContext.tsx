import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authAPI, User, AuthResponse } from '@/services/api';
// import { googleSignInService } from '@/services/googleSignIn'; // Disabled for Expo Go

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearAuthData: () => Promise<void>;
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

  const isAuthenticated = !!user && !!token;

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

      // Trong development, có thể force clear auth data
      if (__DEV__ && false) { // Set thành false để không force clear
        console.log('AuthContext: Force clearing auth data in development');
        await clearAuthData();
        return;
      }

      // Trong development, không validate token với server
      // Chỉ kiểm tra xem có token và user data không
      if (storedToken && storedUser) {
        try {
          // Parse user data để kiểm tra format
          const userData = JSON.parse(storedUser);
          
          // Kiểm tra token có format hợp lệ không (ít nhất 10 ký tự)
          if (storedToken.length > 10 && userData.email) {
            console.log('AuthContext: Valid token and user data found');
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(userData);
          } else {
            console.log('AuthContext: Invalid token or user data, clearing...');
            // Token hoặc user data không hợp lệ, xóa dữ liệu cũ
            await clearAuthData();
          }
        } catch (error) {
          console.error('AuthContext: Error parsing stored user data:', error);
          await clearAuthData();
        }
      } else {
        console.log('AuthContext: No stored token or user data');
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
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
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

        // Lưu token và user data
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('token_expires_at', expiresAt);

        setToken(accessToken);
        setRefreshToken(null); // Backend không trả về refresh token
        setUser(userData);
        
        console.log('Login successful:', userData.email);
        return true;
      } else {
        console.log('AuthContext: Invalid response structure:', response);
        throw new Error('Response không hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', error.response?.data);
      return false;
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
  const googleLogin = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('AuthContext: Attempting Google login...');
      
      // Import googleSignInService dynamically để tránh lỗi trong Expo Go
      const { googleSignInService } = await import('@/services/googleSignIn');
      
      const googleResult = await googleSignInService.signIn();
      
      if (googleResult.idToken) {
        console.log('AuthContext: Google login successful, calling API...');
        
        const response = await authAPI.googleLogin(googleResult.idToken);
        
        console.log('AuthContext: Google API Response:', JSON.stringify(response, null, 2));
        
        const authResponse = response as AuthResponse;
        if (authResponse.token && authResponse.user) {
          const { user: userData, token: accessToken, expiresAt } = authResponse;

          // Lưu token và user data
          await AsyncStorage.setItem('auth_token', accessToken);
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
          await AsyncStorage.setItem('token_expires_at', expiresAt);

          setToken(accessToken);
          setRefreshToken(null);
          setUser(userData);
          
          console.log('Google login successful:', userData.email);
          return true;
        } else {
          throw new Error('Google login response không hợp lệ');
        }
      } else {
        throw new Error('Không thể lấy Google token');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.message.includes('OAuth error')) {
        Alert.alert('Lỗi OAuth', 'Có lỗi xảy ra trong quá trình xác thực Google. Vui lòng thử lại.');
      } else if (error.message.includes('cancelled')) {
        console.log('Google login cancelled by user');
        // Không hiển thị alert cho trường hợp user cancel
      } else if (error.message.includes('invalid request')) {
        Alert.alert('Lỗi cấu hình', 'Cấu hình Google OAuth không đúng. Vui lòng liên hệ admin.');
      } else {
        Alert.alert('Lỗi đăng nhập Google', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
      
      return false;
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
      
      // Xóa tất cả dữ liệu authentication
      await clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra auth status khi component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    googleLogin,
    logout,
    checkAuthStatus,
    clearAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
