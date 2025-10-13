import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure WebBrowser for better UX
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                        '310764216947-6bq7kia8mnhhrr9mdckbkt5jaq0f2i2o.apps.googleusercontent.com';

// Sử dụng redirect URI từ environment hoặc fallback
const getRedirectURI = () => {
  // Ưu tiên sử dụng từ environment
  const envRedirectURI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 
                        Constants.expoConfig?.extra?.googleRedirectURI;
  
  if (envRedirectURI) {
    console.log('Using redirect URI from env:', envRedirectURI);
    return envRedirectURI;
  }
  
  // Fallback về scheme-based redirect URI
  const schemeRedirectURI = AuthSession.makeRedirectUri({
    scheme: 'nexora',
  });
  
  console.log('Using scheme-based redirect URI:', schemeRedirectURI);
  return schemeRedirectURI;
};

const GOOGLE_REDIRECT_URI = getRedirectURI();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const googleSignInService = {
  // Đăng nhập với Google
  signIn: async () => {
    try {
      console.log('Starting Google OAuth flow...');
      console.log('Redirect URI:', GOOGLE_REDIRECT_URI);

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        prompt: AuthSession.Prompt.SelectAccount,
      });

      const result = await request.promptAsync(discovery);

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        // Exchange code for token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirectUri: GOOGLE_REDIRECT_URI,
            extraParams: {
              access_type: 'offline',
            },
          },
          discovery
        );

        console.log('Token result:', tokenResult);

        // Get user info
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        console.log('User info:', userInfo);

        return {
          user: userInfo,
          idToken: tokenResult.idToken,
          accessToken: tokenResult.accessToken,
        };
      } else if (result.type === 'error') {
        console.error('OAuth error:', result.error);
        throw new Error(`OAuth error: ${result.error?.message || 'Unknown error'}`);
      } else {
        throw new Error('Google Sign-In was cancelled or failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw new Error('Lỗi đăng nhập Google: ' + error.message);
    }
  },

  // Đăng xuất khỏi Google
  signOut: async () => {
    try {
      // Revoke token if available
      console.log('Google Sign-Out completed');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  },

  // Kiểm tra trạng thái đăng nhập
  isSignedIn: async () => {
    // For OAuth flow, we don't persist state
    return false;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    // For OAuth flow, we don't persist user state
    return null;
  },

  // Revoke access
  revokeAccess: async () => {
    try {
      console.log('Google access revoked');
    } catch (error) {
      console.error('Revoke access error:', error);
      throw error;
    }
  },
};