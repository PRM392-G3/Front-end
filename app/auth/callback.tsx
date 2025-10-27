import { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { getAPIUrl, API_CONFIG } from '@/config/api';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 
                         Constants.expoConfig?.extra?.googleClientId ||
                         '95566958301-tfjlc5pg05equv408pa9cigob1prg18v.apps.googleusercontent.com';

// Use Expo Auth URI for all platforms
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 
                           Constants.expoConfig?.extra?.googleRedirectURI ||
                           'https://auth.expo.io/@minhtri10504/nexora-app';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Debug: Log EVERYTHING on mount
  if (typeof window !== 'undefined') {
    console.log('==========================================');
    console.log('[AuthCallback] Component MOUNTED');
    console.log('[AuthCallback] URL:', window.location.href);
    console.log('[AuthCallback] Has code:', !!params.code);
    console.log('==========================================');
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] === CALLBACK HANDLER START ===');
        console.log('[AuthCallback] Starting callback handler');
        console.log('[AuthCallback] Params:', JSON.stringify(params, null, 2));
        console.log('[AuthCallback] Redirect URI:', GOOGLE_REDIRECT_URI);
        
        // Check for OAuth success
        if (params.code) {
          console.log('[AuthCallback] OAuth code received, sending to backend...');
          
          // Send code to backend to exchange for token
          const apiUrl = getAPIUrl();
          
          try {
            // Send code to backend's exchange endpoint
            const requestBody = {
              code: params.code as string,
              redirectUri: GOOGLE_REDIRECT_URI,
            };
            
            console.log('[AuthCallback] Sending code to backend:', `${apiUrl}/GoogleOAuth/exchange-code`);
            console.log('[AuthCallback] Request body:', { code: `${requestBody.code.substring(0, 20)}...`, redirectUri: requestBody.redirectUri });
            
            const response = await fetch(`${apiUrl}/GoogleOAuth/exchange-code`, {
              method: 'POST',
              headers: API_CONFIG.HEADERS,
              body: JSON.stringify(requestBody),
            });
            
            const responseText = await response.text();
            console.log('[AuthCallback] Backend response:', responseText);
            
            if (!response.ok) {
              console.error('[AuthCallback] Backend error:', responseText);
              router.replace('/auth/login');
              return;
            }
            
            const data = JSON.parse(responseText);
            console.log('[AuthCallback] Backend data:', data);
            
            if (data.token) {
              console.log('[AuthCallback] Login successful!');
              console.log('[AuthCallback] Saving token to AsyncStorage...');
              
              // Save token to AsyncStorage
              await AsyncStorage.setItem('auth_token', data.token);
              console.log('[AuthCallback] Token saved');
              
              // Also save user data if available
              if (data.user) {
                await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
                console.log('[AuthCallback] User data saved');
              }
              
              console.log('[AuthCallback] Redirecting to home...');
              
              // Wait for auth state to update, then redirect
              setTimeout(() => {
                // Try window.location first, fallback to router
                if (typeof window !== 'undefined') {
                  try {
                    window.location.href = '/';
                  } catch (e) {
                    console.log('[AuthCallback] window.location failed, using router:', e);
                    router.replace('/');
                  }
                } else {
                  // Mobile: Force redirect to tabs
                  router.replace('/(tabs)');
                }
              }, 500);
              return;
            } else if (data.isNewUser) {
              console.log('[AuthCallback] New user, redirecting to complete registration');
              console.log('[AuthCallback] Received data:', {
                isNewUser: data.isNewUser,
                email: data.email,
                googleId: data.googleId,
                fullName: data.fullName,
                avatarUrl: data.avatarUrl
              });
              
              // Redirect to complete registration screen
              console.log('[AuthCallback] Navigating to complete registration with params:', {
                email: data.email,
                googleId: data.googleId,
                fullName: data.fullName,
                avatarUrl: data.avatarUrl
              });
              
              // Use router.push with proper typing
              router.push({
                pathname: '/complete-google-registration' as any,
                params: {
                  email: String(data.email || ''),
                  googleId: String(data.googleId || ''),
                  fullName: String(data.fullName || ''),
                  avatarUrl: String(data.avatarUrl || '')
                } as any
              });
            } else {
              console.error('[AuthCallback] No token or isNewUser flag in response');
              router.replace('/auth/login');
            }
          } catch (apiError) {
            console.error('[AuthCallback] API error:', apiError);
            router.replace('/auth/login');
          }
          return;
        }
        
        if (params.error) {
          console.error('[AuthCallback] OAuth error:', params.error);
          router.replace('/auth/login');
          return;
        }
        
        // No code or error, redirect to login
        console.log('[AuthCallback] No OAuth parameters, redirecting to login');
        router.replace('/auth/login');
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Processing authentication...</Text>
    </View>
  );
}

