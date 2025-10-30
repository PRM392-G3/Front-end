import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { UserPlus, UserMinus, User, Users, Clock } from 'lucide-react-native';
import { User as UserType, userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchCardProps {
  user: UserType;
  onUserPress?: (userId: number) => void;
  showFollowButton?: boolean;
}

export const UserSearchCard: React.FC<UserSearchCardProps> = ({ 
  user, 
  onUserPress,
  showFollowButton = true 
}) => {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<{
    isFriend: boolean;
    hasPendingRequest: boolean;
    requesterId?: number;
  } | null>(null);
  const [loadingFriendship, setLoadingFriendship] = useState(true);
  const { user: currentUser } = useAuth();

  // Load friendship status when component mounts
  useEffect(() => {
    const loadFriendshipStatus = async () => {
      if (!currentUser || user.id === currentUser.id) {
        setLoadingFriendship(false);
        return;
      }

      try {
        console.log(`🚀 [UserSearchCard] Loading friendship status for user ${user.id}`);
        const response = await userAPI.getFriendshipStatus(currentUser.id, user.id);
        console.log(`✅ [UserSearchCard] Friendship status raw:`, response);
        
        // Handle different response formats
        let status: {
          isFriend: boolean;
          hasPendingRequest: boolean;
          requesterId?: number;
        };
        
        if (typeof response === 'object' && 'status' in response) {
          const backendStatus = (response as any).status;
          status = {
            isFriend: backendStatus === 'accepted',
            hasPendingRequest: backendStatus === 'pending',
            requesterId: (response as any).requesterId,
          };
        } else {
          status = response as any;
        }
        
        console.log(`✅ [UserSearchCard] Processed friendship status:`, status);
        setFriendshipStatus(status);
      } catch (error: any) {
        console.error('❌ [UserSearchCard] Error loading friendship status:', error);
        setFriendshipStatus({
          isFriend: false,
          hasPendingRequest: false,
        });
      } finally {
        setLoadingFriendship(false);
      }
    };

    loadFriendshipStatus();
  }, [currentUser, user.id]);

  const handleSendFriendRequest = async () => {
    if (!currentUser?.id) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🚀 [UserSearchCard] Sending friend request to user ${user.id}`);
      await userAPI.sendFriendRequest(currentUser.id, user.id);
      console.log(`✅ [UserSearchCard] Friend request sent successfully`);
      
      // Update local state
      setFriendshipStatus({
        isFriend: false,
        hasPendingRequest: true,
        requesterId: currentUser.id,
      });
      
      Alert.alert('Thành công', `Đã gửi lời mời kết bạn đến ${user.fullName}`);
    } catch (error: any) {
      console.error('❌ [UserSearchCard] Error sending friend request:', error);
      
      let errorMessage = 'Không thể gửi lời mời kết bạn';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Đã có lời mời kết bạn tồn tại';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy người dùng';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.id) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
      return;
    }

    if (user.id === currentUser.id) {
      Alert.alert('Thông báo', 'Bạn không thể theo dõi chính mình');
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await userAPI.unfollowUser(currentUser.id, user.id);
        setIsFollowing(false);
        Alert.alert('Thành công', `Đã hủy theo dõi ${user.fullName}`);
      } else {
        // Follow
        await userAPI.followUser(currentUser.id, user.id);
        setIsFollowing(true);
        Alert.alert('Thành công', `Đã theo dõi ${user.fullName}`);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      
      let errorMessage = 'Không thể thực hiện thao tác này';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data || 'Dữ liệu không hợp lệ';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy người dùng';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = () => {
    console.log(`👆 [UserSearchCard] User pressed: ${user.fullName} (ID: ${user.id})`);
    console.log(`👆 [UserSearchCard] About to call onUserPress with userId: ${user.id}`);
    if (onUserPress) {
      onUserPress(user.id);
      console.log(`✅ [UserSearchCard] onUserPress called successfully`);
    } else {
      console.warn('❌ [UserSearchCard] onUserPress callback not provided');
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleUserPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <User size={24} color={COLORS.gray} />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.fullName}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>

      {showFollowButton && user.id !== currentUser?.id && (
        <>
          {loadingFriendship ? (
            <View style={styles.followButton}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : friendshipStatus?.isFriend ? (
            <TouchableOpacity
              style={[styles.followButton, styles.friendButton]}
              disabled={true}
            >
              <Users size={16} color={COLORS.white} />
              <Text style={styles.followButtonText}>Bạn bè</Text>
            </TouchableOpacity>
          ) : friendshipStatus?.hasPendingRequest ? (
            <TouchableOpacity
              style={[styles.followButton, styles.pendingButton]}
              disabled={true}
            >
              <Clock size={16} color={COLORS.white} />
              <Text style={styles.followButtonText}>Đã gửi lời mời</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.followButton,
                isLoading && styles.loadingButton
              ]}
              onPress={handleSendFriendRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <UserPlus size={16} color={COLORS.white} />
                  <Text style={styles.followButtonText}>Thêm bạn bè</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  avatarContainer: {
    marginRight: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.text.lightGray,
  } as ImageStyle,
  userInfo: {
    flex: 1,
  } as ViewStyle,
  fullName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  } as TextStyle,
  email: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
    marginBottom: 4,
  } as TextStyle,
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.darkGray,
    marginBottom: 8,
    lineHeight: 18,
  } as TextStyle,
  mutualFriends: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  } as TextStyle,
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: RESPONSIVE_SPACING.xs,
    minWidth: 120,
    justifyContent: 'center',
  } as ViewStyle,
  friendButton: {
    backgroundColor: COLORS.darkGray,
  } as ViewStyle,
  pendingButton: {
    
    backgroundColor: COLORS.text.gray,
  } as ViewStyle,
  followingButton: {
    backgroundColor: COLORS.text.gray,
  } as ViewStyle,
  loadingButton: {
    backgroundColor: COLORS.text.gray,
  } as ViewStyle,
  followButtonText: {
    color: COLORS.text.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  } as TextStyle,
});
