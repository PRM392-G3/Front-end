import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';

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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
