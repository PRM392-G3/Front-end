import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { UserPlus, UserMinus, User } from 'lucide-react-native';
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
  const { user: currentUser } = useAuth();

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

  const getMutualFriendsText = () => {
    // Trong thực tế, bạn có thể có API để lấy số bạn chung
    // Hiện tại sẽ hiển thị số ngẫu nhiên hoặc ẩn đi
    const mutualCount = Math.floor(Math.random() * 20);
    return mutualCount > 0 ? `${mutualCount} bạn chung` : '';
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
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {user.followersCount || 0} người theo dõi
          </Text>
          <Text style={styles.statText}>
            {user.followingCount || 0} đang theo dõi
          </Text>
        </View>
        {getMutualFriendsText() && (
          <Text style={styles.mutualFriends}>{getMutualFriendsText()}</Text>
        )}
      </View>

      {showFollowButton && user.id !== currentUser?.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
            isLoading && styles.loadingButton
          ]}
          onPress={handleFollowToggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              {isFollowing ? (
                <UserMinus size={16} color={COLORS.white} />
              ) : (
                <UserPlus size={16} color={COLORS.white} />
              )}
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  stats: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.md,
    marginBottom: 4,
  } as ViewStyle,
  statText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
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
    minWidth: 100,
    justifyContent: 'center',
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
