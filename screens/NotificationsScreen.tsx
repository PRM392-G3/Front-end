import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ViewStyle, 
  TextStyle,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { Settings, Bell, CheckCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { notificationAPI, Notification } from '@/services/api';
import { useRouter } from 'expo-router';
import notificationService from '@/services/notificationService';
import NotificationItem from '@/components/NotificationItem';
import AppStatusBar from '@/components/AppStatusBar';

type TabType = 'all' | 'unread';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const data = await notificationAPI.getNotifications(user.id);
      setNotifications(data);
      
      // Filter based on active tab
      if (activeTab === 'unread') {
        setFilteredNotifications(data.filter(n => !n.isRead));
      } else {
        setFilteredNotifications(data);
      }
      
      // Update unread count
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      // Update badge
      await notificationService.setBadgeCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, activeTab]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  // Tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    
    if (tab === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.isRead));
    } else {
      setFilteredNotifications(notifications);
    }
  }, [notifications]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await notificationAPI.markAllAsRead(user.id);
      
      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setFilteredNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Update badge
      await notificationService.setBadgeCount(0);
      
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc');
    }
  }, [user, notifications]);

  // Handle notification press
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead && user) {
      try {
        await notificationAPI.markAsRead(notification.id);
        
        // Update local state
        const updatedNotifications = notifications.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);
        
        const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        await notificationService.setBadgeCount(newUnreadCount);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on notification type
    navigateBasedOnType(notification);
  }, [user, notifications, router]);

  // Navigation logic
  const navigateBasedOnType = (notification: Notification) => {
    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'POST_SHARE':
        if (notification.postId) {
          router.push(`/post-detail?id=${notification.postId}`);
        }
        break;
      
      case 'FRIEND_REQUEST':
        router.push('/friend-requests');
        break;
      
      case 'FRIEND_ACCEPTED':
        if (notification.fromUserId) {
          router.push(`/profile?userId=${notification.fromUserId}`);
        }
        break;
      
      case 'MESSAGE':
        if (notification.fromUserId) {
          router.push(`/chat?userId=${notification.fromUserId}`);
        }
        break;
      
      case 'GROUP_JOIN_REQUEST':
        if (notification.groupId) {
          router.push(`/group-pending-requests?groupId=${notification.groupId}`);
        }
        break;
      
      case 'GROUP_JOIN_APPROVED':
      case 'GROUP_INVITATION':
        if (notification.groupId) {
          router.push(`/group-detail?id=${notification.groupId}`);
        }
        break;
      
      case 'REEL_LIKE':
      case 'REEL_COMMENT':
        if (notification.reelId) {
          router.push(`/(tabs)/reels?reelId=${notification.reelId}`);
        }
        break;
      
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Vui lòng đăng nhập</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppStatusBar barStyle="light-content" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bell size={24} color={COLORS.text.white} />
            <Text style={styles.headerTitle}>Thông báo</Text>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <CheckCheck size={20} color={COLORS.text.white} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.notificationStats}>
          <Text style={styles.statsText}>
            {unreadCount > 0 
              ? `Bạn có ${unreadCount} thông báo mới` 
              : 'Không có thông báo mới'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => handleTabChange('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Chưa đọc ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={64} color={COLORS.text.gray} />
              <Text style={styles.emptyText}>
                {activeTab === 'unread' 
                  ? 'Không có thông báo chưa đọc' 
                  : 'Chưa có thông báo nào'}
              </Text>
            </View>
          }
          contentContainerStyle={
            filteredNotifications.length === 0 ? styles.emptyList : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,
  headerGradient: {
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.lg,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text.white,
    letterSpacing: 0.5,
  } as TextStyle,
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  notificationStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  statsText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  } as ViewStyle,
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  } as ViewStyle,
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    fontWeight: '500',
  } as TextStyle,
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  } as ViewStyle,
  unreadNotification: {
    backgroundColor: `${COLORS.primary}10`,
  } as ViewStyle,
  notificationContent: {
    flex: 1,
  } as ViewStyle,
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  } as TextStyle,
  notificationMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
    marginBottom: 4,
  } as TextStyle,
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
  } as TextStyle,
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  } as ViewStyle,
  emptyList: {
    flexGrow: 1,
  } as ViewStyle,
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.gray,
    marginTop: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  } as TextStyle,
});
