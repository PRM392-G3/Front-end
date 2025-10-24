import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { User, Check, X } from 'lucide-react-native';
import { FriendRequest, userAPI } from '@/services/api';
import { router } from 'expo-router';

interface FriendRequestCardProps {
  friendRequest: FriendRequest;
  onRespond: (requestId: number, accepted: boolean) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ 
  friendRequest, 
  onRespond 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // The requester is the person who sent the friend request
  const requester = friendRequest.requester;

  // Safety check: if requester is undefined, don't render
  if (!requester) {
    console.warn('⚠️ [FriendRequestCard] Requester is undefined for friend request:', friendRequest);
    return null;
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      console.log(`🚀 [FriendRequestCard] Accepting friend request ${friendRequest.id}`);
      await userAPI.respondToFriendRequest(friendRequest.id, 'accepted');
      console.log(`✅ [FriendRequestCard] Friend request accepted`);
      
      Alert.alert('Thành công', `Bạn và ${requester.fullName} đã trở thành bạn bè`);
      onRespond(friendRequest.id, true);
    } catch (error: any) {
      console.error('❌ [FriendRequestCard] Error accepting friend request:', error);
      
      let errorMessage = 'Không thể chấp nhận lời mời';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy lời mời kết bạn';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      console.log(`🚀 [FriendRequestCard] Rejecting friend request ${friendRequest.id}`);
      await userAPI.respondToFriendRequest(friendRequest.id, 'rejected');
      console.log(`✅ [FriendRequestCard] Friend request rejected`);
      
      Alert.alert('Thành công', `Đã từ chối lời mời kết bạn từ ${requester.fullName}`);
      onRespond(friendRequest.id, false);
    } catch (error: any) {
      console.error('❌ [FriendRequestCard] Error rejecting friend request:', error);
      
      let errorMessage = 'Không thể từ chối lời mời';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy lời mời kết bạn';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = () => {
    console.log(`👆 [FriendRequestCard] User pressed: ${requester.fullName} (ID: ${requester.id})`);
    router.push({
      pathname: '/profile',
      params: { userId: requester.id.toString() }
    } as any);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.userInfoContainer}
        onPress={handleUserPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {requester.avatarUrl ? (
            <Image source={{ uri: requester.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={32} color={COLORS.gray} />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.fullName}>{requester.fullName}</Text>
          {requester.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {requester.bio}
            </Text>
          )}
          <Text style={styles.timeAgo}>
            {getTimeAgo(friendRequest.requestedAt)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAccept}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Check size={18} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Chấp nhận</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.text.gray} />
          ) : (
            <>
              <X size={18} color={COLORS.text.gray} />
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  avatarContainer: {
    marginRight: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
  } as ImageStyle,
  avatarPlaceholder: {
    backgroundColor: COLORS.text.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  userInfo: {
    flex: 1,
  } as ViewStyle,
  fullName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  } as TextStyle,
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.darkGray,
    marginBottom: 4,
  } as TextStyle,
  timeAgo: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
  } as TextStyle,
  actionsContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  acceptButton: {
    backgroundColor: COLORS.primary,
  } as ViewStyle,
  acceptButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  } as TextStyle,
  rejectButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  } as ViewStyle,
  rejectButtonText: {
    color: COLORS.text.gray,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  } as TextStyle,
});

