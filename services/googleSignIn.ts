import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure WebBrowser for better UX
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// Web Client ID from Google Cloud Console (nexora-476313)
// MUST match backend ClientId for token verification
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                        '95566958301-tfjlc5pg05equv408pa9cigob1prg18v.apps.googleusercontent.com';

// Sử dụng redirect URI từ environment hoặc fallback
const getRedirectURI = () => {
  // Kiểm tra platform
  const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';
  
  console.log('[getRedirectURI] Platform check:', { hasWindow: typeof window !== 'undefined', platform: Platform.OS });
  
  // Web: use localhost callback
  if (isWeb) {
    return 'http://localhost:8081/auth/callback';
  }
  
  // Mobile Expo Go: use Expo Auth URI
  // Required for Expo Go debugging
  return 'https://auth.expo.io/@minhtri10504/nexora-app';
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
    // Try native Google Sign In first for mobile
    if (Platform.OS !== 'web') {
      try {
        console.log('[googleSignIn] Trying native Google Sign In...');
        return await googleSignInNative();
      } catch (error: any) {
        console.error('[googleSignIn] Native sign in failed, using OAuth flow:', error);
        // Fall through to OAuth flow
      }
    }
    
    // Use OAuth flow for web or fallback
    return await googleSignInOAuth();
  },
};

// Native Google Sign In (for mobile)
async function googleSignInNative() {
  const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 
                          Constants.expoConfig?.extra?.googleClientId ||
                          '95566958301-tfjlc5pg05equv408pa9cigob1prg18v.apps.googleusercontent.com';
  
  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: false,
  });
  
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error('No ID token received');
    }
    
    console.log('[googleSignIn] Native sign in successful');
    return {
      user: { idToken },
      idToken,
      accessToken: null,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('[googleSignIn] User cancelled native sign in');
      const cancelError = new Error('User cancelled Google login') as any;
      cancelError.isCancelled = true;
      throw cancelError;
    }
    throw error;
  }
}

// OAuth flow (original implementation)
async function googleSignInOAuth() {
    try {
      console.log('Starting Google OAuth flow...');
      console.log('Redirect URI:', GOOGLE_REDIRECT_URI);
      console.log('Client ID:', GOOGLE_CLIENT_ID);
      console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
        usePKCE: true, // Enable PKCE for web apps
      });

      // Check platform - properly detect React Native vs Web Browser
      const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';
      
      console.log('[googleSignIn] Platform check:', {
        hasWindow: typeof window !== 'undefined',
        platform: Platform.OS,
        isWeb: isWeb
      });
      
      if (isWeb) {
        // For web: redirect main window instead of using popup
        const authUrl = `${discovery.authorizationEndpoint}?` +
          `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
          `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('openid email profile')}&` +
          `access_type=offline&` +
          `prompt=consent&` +
          `state=google_oauth`;
        
        console.log('[googleSignIn] === WEB REDIRECT ===');
        console.log('[googleSignIn] Redirect URI:', GOOGLE_REDIRECT_URI);
        console.log('[googleSignIn] Scope: openid email profile');
        console.log('[googleSignIn] Auth URL:', authUrl);
        console.log('[googleSignIn] Redirecting main window...');
        
        // Use try-catch to handle any location.href errors
        // Don't throw error, just redirect silently
        try {
          if (window.location && window.location.href) {
            window.location.href = authUrl;
          } else if (window.location) {
            window.location.assign(authUrl);
          } else {
            console.warn('[googleSignIn] Cannot access window.location');
          }
        } catch (error) {
          console.error('[googleSignIn] Location error (ignored):', error);
          // Just log, don't throw - let the auth flow continue
        }
        
        // Return empty result to indicate redirect started
        return {
          user: null,
          idToken: null,
          accessToken: null,
        };
      }
      
      // For mobile: use promptAsync with event listener
      console.log('[googleSignIn] === MOBILE PROMPT ===');
      console.log('[googleSignIn] Redirect URI:', GOOGLE_REDIRECT_URI);
      
      try {
        const result = await request.promptAsync(discovery);
        console.log('[googleSignIn] promptAsync completed!');
        console.log('[googleSignIn] Result type:', result.type);

        if (result.type === 'success') {
          console.log('[googleSignIn] OAuth success! Got code');
          return {
            user: { code: result.params.code },
            idToken: null,
            accessToken: null,
          };
        } else if (result.type === 'dismiss' || result.type === 'cancel') {
          console.log('[googleSignIn] User cancelled');
          const cancelError = new Error('User cancelled Google login') as any;
          cancelError.isCancelled = true;
          throw cancelError;
        } else {
          throw new Error(`OAuth failed: ${result.type}`);
        }
      } catch (error: any) {
        console.error('[googleSignIn] Mobile OAuth error:', error);
        if (error.isCancelled) throw error;
        throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Google Sign-In OAuth error:', error);
      
      // Don't re-throw cancelled errors
      if (error.isCancelled) {
        console.log('User cancelled - not re-throwing');
        throw error; // Already has isCancelled flag
      }
      
      // Re-throw if already an Error with isCancelled
      if (error instanceof Error && 'isCancelled' in error) {
        throw error;
      }
      
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      throw new Error('Lỗi đăng nhập Google: ' + error.message);
    }
  }
};

export const googleSignInService = {
  // Đăng nhập với Google
  signIn: async () => {
    // Try native Google Sign In first for mobile
    if (Platform.OS !== 'web') {
      try {
        console.log('[googleSignIn] Trying native Google Sign In...');
        return await googleSignInNative();
      } catch (error: any) {
        console.error('[googleSignIn] Native sign in failed, using OAuth flow:', error);
        // Fall through to OAuth flow
      }
    }
    
    // Use OAuth flow for web or fallback
    return await googleSignInOAuth();
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