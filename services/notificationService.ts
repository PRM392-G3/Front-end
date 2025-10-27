import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Cấu hình cách hiển thị notification khi app đang mở (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'MESSAGE' | 
        'GROUP_JOIN_REQUEST' | 'GROUP_JOIN_APPROVED' | 'GROUP_INVITATION';
  postId?: string;
  commentId?: string;
  fromUserId?: string;
  groupId?: string;
  [key: string]: any;
}

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Yêu cầu quyền notification
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('NotificationService: Must use physical device for Push Notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('NotificationService: Permission not granted');
        return false;
      }

      console.log('NotificationService: Permission granted');
      return true;
    } catch (error) {
      console.error('NotificationService: Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Lấy Expo Push Token (FCM token)
   * Đây là token dùng để gửi notification qua Expo Push Notification service
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('NotificationService: Must use physical device for Push Notifications');
        return null;
      }

      // Lấy projectId từ app.json
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('NotificationService: No projectId found. Please set up EAS project.');
        // Nếu không có projectId, vẫn có thể lấy token nhưng cần cấu hình thêm
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log('NotificationService: Expo Push Token:', token.data);
      return token.data;
    } catch (error: any) {
      console.error('NotificationService: Error getting Expo Push Token:', error);
      console.error('NotificationService: Error message:', error.message);
      
      // Nếu chưa có projectId, hướng dẫn người dùng
      if (error.message?.includes('projectId')) {
        console.warn('NotificationService: Please run "eas init" to set up EAS project');
      }
      
      return null;
    }
  }

  /**
   * Cấu hình notification channel cho Android
   */
  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  /**
   * Lắng nghe notification khi app đang mở (foreground)
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Lắng nghe khi user click vào notification
   */
  onNotificationResponse(callback: (response: NotificationResponse) => void): void {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Gỡ bỏ các listener
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Hiển thị local notification (để test)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Hiển thị ngay lập tức
      });

      return notificationId;
    } catch (error) {
      console.error('NotificationService: Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Lấy notification cuối cùng khi mở app (từ killed state)
   */
  async getLastNotificationResponse(): Promise<NotificationResponse | null> {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      return response;
    } catch (error) {
      console.error('NotificationService: Error getting last notification:', error);
      return null;
    }
  }

  /**
   * Đặt badge count (số notification chưa đọc)
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('NotificationService: Error setting badge count:', error);
    }
  }

  /**
   * Lấy badge count hiện tại
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('NotificationService: Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Xóa tất cả notifications
   */
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('NotificationService: Error dismissing notifications:', error);
    }
  }

  /**
   * Xóa tất cả notifications và reset badge
   */
  async clearAll(): Promise<void> {
    try {
      await this.dismissAllNotifications();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('NotificationService: Error clearing all:', error);
    }
  }
}

export default new NotificationService();

