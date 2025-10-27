import { router } from 'expo-router';

export interface NotificationData {
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'MESSAGE' | 
        'GROUP_JOIN_REQUEST' | 'GROUP_JOIN_APPROVED' | 'GROUP_INVITATION' |
        'POST_SHARE' | 'REEL_LIKE' | 'REEL_COMMENT';
  postId?: string | number;
  commentId?: string | number;
  fromUserId?: string | number;
  groupId?: string | number;
  reelId?: string | number;
  [key: string]: any;
}

/**
 * Xử lý navigation dựa trên notification data
 */
export const handleNotificationNavigation = (data: any) => {
  if (!data || !data.type) {
    console.log('notificationNavigation: No notification data to handle');
    return;
  }

  console.log('notificationNavigation: Handling navigation for type:', data.type);

  try {
    switch (data.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'POST_SHARE':
        if (data.postId) {
          console.log('notificationNavigation: Navigating to post:', data.postId);
          router.push(`/post-detail?id=${data.postId}`);
        }
        break;
      
      case 'FRIEND_REQUEST':
        console.log('notificationNavigation: Navigating to friend requests');
        router.push('/friend-requests');
        break;
      
      case 'FRIEND_ACCEPTED':
        if (data.fromUserId) {
          console.log('notificationNavigation: Navigating to user profile:', data.fromUserId);
          router.push(`/profile?userId=${data.fromUserId}`);
        }
        break;
      
      case 'MESSAGE':
        if (data.fromUserId) {
          console.log('notificationNavigation: Navigating to chat:', data.fromUserId);
          router.push(`/(tabs)/chat?userId=${data.fromUserId}`);
        }
        break;
      
      case 'GROUP_JOIN_REQUEST':
        if (data.groupId) {
          console.log('notificationNavigation: Navigating to group pending requests:', data.groupId);
          router.push(`/group-pending-requests?groupId=${data.groupId}`);
        }
        break;
      
      case 'GROUP_JOIN_APPROVED':
      case 'GROUP_INVITATION':
        if (data.groupId) {
          console.log('notificationNavigation: Navigating to group detail:', data.groupId);
          router.push(`/group-detail?id=${data.groupId}`);
        }
        break;
      
      case 'REEL_LIKE':
      case 'REEL_COMMENT':
        if (data.reelId) {
          console.log('notificationNavigation: Navigating to reel:', data.reelId);
          router.push(`/(tabs)/reels?reelId=${data.reelId}`);
        }
        break;
      
      default:
        console.log('notificationNavigation: Unknown notification type, navigating to notifications list');
        router.push('/(tabs)/notifications');
    }
  } catch (error) {
    console.error('notificationNavigation: Error navigating:', error);
    // Fallback to notifications list on error
    router.push('/(tabs)/notifications');
  }
};

/**
 * Lấy icon type cho notification component
 */
export const getNotificationIconType = (type: string): 'like' | 'comment' | 'friend' | 'event' => {
  switch (type) {
    case 'LIKE':
    case 'REEL_LIKE':
      return 'like';
    
    case 'COMMENT':
    case 'REEL_COMMENT':
      return 'comment';
    
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return 'friend';
    
    case 'GROUP_JOIN_REQUEST':
    case 'GROUP_JOIN_APPROVED':
    case 'GROUP_INVITATION':
    case 'MESSAGE':
    default:
      return 'event';
  }
};

