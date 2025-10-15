import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { PostProvider } from '@/contexts/PostContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Cập nhật title và meta tags cho web
      document.title = 'Nexora - Social Platform';
      
      // Cập nhật meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Nexora - Social Platform. Kết nối và chia sẻ với cộng đồng.');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = 'Nexora - Social Platform. Kết nối và chia sẻ với cộng đồng.';
        document.head.appendChild(meta);
      }

      // Cập nhật theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#6366F1');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#6366F1';
        document.head.appendChild(meta);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <PostProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </PostProvider>
    </SafeAreaProvider>
  );
}
