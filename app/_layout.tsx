import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { PostProvider } from '@/contexts/PostContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notificationService from '@/services/notificationService';
import * as Notifications from 'expo-notifications';
import NotificationManager from '@/components/NotificationManager';

// Cấu hình handler cho notification khi app đang chạy
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Setup notification service listeners
    setupNotificationHandlers();

    // Cleanup listeners khi component unmount
    return () => {
      notificationService.removeListeners();
    };
  }, []);

  const setupNotificationHandlers = () => {
    // Lắng nghe notification khi app đang mở (foreground)
    notificationService.onNotificationReceived((notification) => {
      console.log('🔔 [RootLayout] Notification received:', notification);
      // Notification sẽ được hiển thị tự động bởi hệ thống
      // vì đã set shouldShowAlert: true trong handler
    });

    // Lắng nghe khi user click vào notification
    notificationService.onNotificationResponse((response) => {
      console.log('🔔 [RootLayout] User clicked notification:', response);
      const notification = response.notification;
      const data = notification.request.content.data;
      
      // Handle navigation based on notification type
      if (data) {
        // TODO: Add navigation logic based on notification data
        console.log('Notification data:', data);
      }
    });
  };

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
      <AuthProvider>
        <PostProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="following" />
            <Stack.Screen name="followers" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="post-detail" />
            <Stack.Screen name="edit-post" />
            <Stack.Screen name="profile-test" />
            <Stack.Screen name="complete-google-registration" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <NotificationManager />
        </PostProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}