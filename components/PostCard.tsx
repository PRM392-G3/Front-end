import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal, Trash2, Edit } from 'lucide-react-native';
import { PostResponse, postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface PostCardProps {
  postData: PostResponse;
  onPostUpdated?: (post: PostResponse) => void;
  onPostDeleted?: (postId: number) => void;
  onLikeToggle?: (postId: number, isLiked: boolean) => void;
  showImage?: boolean;
}

export default function PostCard({ 
  postData,
  onPostUpdated,
  onPostDeleted,
  onLikeToggle,
  showImage = true
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(() => {
    // Check if current user has liked this post
    if (user?.id && postData.likes && Array.isArray(postData.likes)) {
      return postData.likes.some(like => like.userId === user.id);
    }
    return postData.isLiked || false;
  });
  const [likesCount, setLikesCount] = useState(postData.likeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const isOwnPost = user?.id === postData.userId;

  // Tags are already provided by backend in postData.tags
  // No need to fetch them separately

  const handleViewPost = () => {
    router.push(`/post-detail?postId=${postData.id}`);
  };

  const handleEditPost = () => {
    router.push({
      pathname: '/edit-post',
      params: { post: JSON.stringify(postData) }
    });
  };

  const formatTimestamp = (dateString: string) => {
    try {
      console.log('PostCard: Raw date string from backend:', dateString);
      
      // Parse the date string
      let date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('PostCard: Invalid date string:', dateString);
        return 'Thời gian không hợp lệ';
      }
      
      console.log('PostCard: Parsed date (UTC):', date.toISOString());
      console.log('PostCard: Parsed date (Local):', date.toLocaleString('vi-VN'));
      
      // Based on the format "2025-10-15 13:40:29.414779", this appears to be UTC time
      // without timezone indicator, so we need to add 7 hours to get Vietnam time
      console.log('PostCard: Backend time appears to be UTC without timezone indicator');
      console.log('PostCard: Converting to Vietnam time (UTC+7)');
      
      // Add 7 hours to get Vietnam time
      const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      date = vietnamTime;
      
      console.log('PostCard: Final date (Vietnam time):', date.toLocaleString('vi-VN'));
      console.log('PostCard: Current time (Vietnam):', new Date().toLocaleString('vi-VN'));
      
      // Show actual time in Vietnamese format
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch (error) {
      console.error('PostCard: Error formatting timestamp:', error);
      return 'Thời gian không hợp lệ';
    }
  };

  const handleLikeToggle = async () => {
    if (!user?.id || isLoading) return;

    try {
      setIsLoading(true);
      
      if (isLiked) {
        console.log(`PostCard: Unliking post ${postData.id} for user ${user.id}`);
        await postAPI.unlikePost(postData.id, user.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onLikeToggle?.(postData.id, false);
        console.log(`PostCard: Successfully unliked post ${postData.id}`);
      } else {
        console.log(`PostCard: Liking post ${postData.id} for user ${user.id}`);
        await postAPI.likePost(postData.id, user.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        onLikeToggle?.(postData.id, true);
        console.log(`PostCard: Successfully liked post ${postData.id}`);
      }
    } catch (error) {
      console.error('PostCard: Error toggling like:', error);
      console.error('PostCard: Error details:', error.response?.data);
      console.error('PostCard: Error status:', error.response?.status);
      
      // Revert the UI state on error
      if (isLiked) {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      } else {
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      }
      
      Alert.alert('Lỗi', 'Không thể thực hiện hành động này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await postAPI.deletePost(postData.id);
              onPostDeleted?.(postData.id);
              Alert.alert('Thành công', 'Bài viết đã được xóa.', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Post will be removed from HomePage via onPostDeleted callback
                  }
                }
              ]);
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Lỗi', 'Không thể xóa bài viết. Vui lòng thử lại.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMoreOptions = () => {
    if (isOwnPost) {
      Alert.alert(
        'Tùy chọn',
        'Chọn hành động cho bài viết của bạn',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xem chi tiết', onPress: handleViewPost },
          { text: 'Chỉnh sửa', onPress: handleEditPost },
          { text: 'Xóa bài viết', style: 'destructive', onPress: handleDeletePost }
        ]
      );
    } else {
      Alert.alert(
        'Tùy chọn',
        'Chọn hành động',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xem chi tiết', onPress: handleViewPost }
        ]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleViewPost}
      activeOpacity={0.95}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {postData.user.avatarUrl && (
              <Image source={{ uri: postData.user.avatarUrl }} style={styles.avatarImage} />
            )}
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{postData.user.fullName}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(postData.createdAt)}</Text>
          </View>
        </View>
        {isOwnPost && (
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={handleMoreOptions}
            disabled={isLoading}
          >
            <MoreHorizontal size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.content}>{postData.content}</Text>

      {/* Display tags if available */}
      {(() => {
        console.log('PostCard: Full postData:', JSON.stringify(postData, null, 2));
        console.log('PostCard: tags from backend:', postData.tags);
        console.log('PostCard: tags length:', postData.tags?.length);
        console.log('PostCard: tags type:', typeof postData.tags);
        
        if (postData.tags && Array.isArray(postData.tags) && postData.tags.length > 0) {
          return (
            <View style={styles.tagsContainer}>
              {postData.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag?.name || 'Unknown Tag'}
                </Text>
              ))}
            </View>
          );
        }
        
        // Fallback: try to extract tags from content
        const tagMatches = postData.content?.match(/#\w+/g);
        if (tagMatches && tagMatches.length > 0) {
          return (
            <View style={styles.tagsContainer}>
              {tagMatches.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          );
        }
        
        return null;
      })()}

      {showImage && postData.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: postData.imageUrl }} style={styles.image} />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLikeToggle}
          disabled={isLoading}
        >
          <Heart 
            size={20} 
            color={isLiked ? COLORS.error : COLORS.gray} 
            fill={isLiked ? COLORS.error : 'transparent'}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleViewPost}
        >
          <MessageCircle size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{postData.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{postData.shareCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginBottom: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginRight: RESPONSIVE_SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  userText: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  moreButton: {
    padding: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  content: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    lineHeight: 24,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    fontWeight: '400',
  },
  imageContainer: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  imageText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.lg,
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
    paddingVertical: RESPONSIVE_SPACING.xs,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  likedText: {
    color: COLORS.error,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.xs,
  },
  tag: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
});
