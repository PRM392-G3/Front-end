import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { notificationAPI, Notification as NotificationType } from '@/services/api';
import notificationService from '@/services/notificationService';
import NotificationPopup from './NotificationPopup';

export default function NotificationManager() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUnreadCount, setLastUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [newNotification, setNewNotification] = useState<NotificationType | null>(null);

  useEffect(() => {
    if (!user) return;

    // Setup Android channel for notifications
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await notificationService.setupAndroidChannel();
      }

      // Request permissions
      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        console.log('✅ [NotificationManager] Permissions granted');
        
        // Get push token
        const token = await notificationService.getExpoPushToken();
        if (token) {
          console.log('✅ [NotificationManager] Push token:', token);
          // TODO: Send token to your backend server
        }
      }
    };

    setupNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Load unread count and check for new notifications
    const checkForNewNotifications = async () => {
      try {
        const count = await notificationAPI.getUnreadCount(user.id);
        
        // Check if there's a new notification
        if (count > lastUnreadCount && lastUnreadCount > 0) {
          // Get the latest notification
          try {
            const notifications = await notificationAPI.getNotifications(user.id);
            const latestUnread = notifications.find(n => !n.isRead);
            
            if (latestUnread) {
              // 1. Show system notification (push notification)
              await notificationService.scheduleLocalNotification(
                latestUnread.title,
                latestUnread.message,
                {
                  type: latestUnread.type as any,
                  postId: latestUnread.postId?.toString(),
                  fromUserId: latestUnread.fromUserId?.toString(),
                  groupId: latestUnread.groupId?.toString(),
                }
              );
              
              // 2. Show in-app popup
              setNewNotification(latestUnread);
              setShowPopup(true);
              
              console.log('🔔 [NotificationManager] New notification detected:', latestUnread.title);
            }
          } catch (error) {
            console.error('Error loading latest notification:', error);
          }
        }
        
        setUnreadCount(count);
        setLastUnreadCount(count);
        
        // Update badge count
        await notificationService.setBadgeCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    // Check immediately
    checkForNewNotifications();

    // Check every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000);

    return () => clearInterval(interval);
  }, [user, lastUnreadCount]);

  const handleClosePopup = () => {
    setShowPopup(false);
    setNewNotification(null);
  };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <NotificationPopup
        notification={newNotification}
        visible={showPopup}
        onClose={handleClosePopup}
      />
    </View>
  );
}

