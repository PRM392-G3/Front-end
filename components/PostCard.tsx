import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
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
    return postData.isLiked || false;
  });
  const [likesCount, setLikesCount] = useState(postData.likeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const isOwnPost = user?.id === postData.userId;

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return postTime.toLocaleDateString('vi-VN');
  };

  const handleViewPost = () => {
    router.push(`/(tabs)`);
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Tùy chọn',
      'Bạn muốn làm gì với bài viết này?',
      [
        {
          text: 'Chỉnh sửa',
          onPress: () => {
            // Navigate to edit post screen
            router.push(`/(tabs)/create`);
          },
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Xác nhận xóa',
              'Bạn có chắc chắn muốn xóa bài viết này?',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: handleDeletePost,
                },
              ]
            );
          },
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const handleDeletePost = async () => {
    try {
      setIsLoading(true);
      await postAPI.deletePost(postData.id);
      onPostDeleted?.(postData.id);
      console.log(`PostCard: Successfully deleted post ${postData.id}`);
    } catch (error: any) {
      console.error('PostCard: Error deleting post:', error);
      Alert.alert('Lỗi', 'Không thể xóa bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Optimistically update UI
      if (isLiked) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onLikeToggle?.(postData.id, false);
      } else {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        onLikeToggle?.(postData.id, true);
      }

      // Make API call
      if (isLiked) {
        await postAPI.unlikePost(postData.id, user?.id || 0);
        console.log(`PostCard: Successfully unliked post ${postData.id}`);
      } else {
        await postAPI.likePost(postData.id, user?.id || 0);
        console.log(`PostCard: Successfully liked post ${postData.id}`);
      }
    } catch (error: any) {
      console.error('PostCard: Error toggling like:', error);
      console.error('PostCard: Error details:', error.response?.data);
      console.error('PostCard: Error status:', error.response?.status);
      
      // Revert the UI state on error
      if (isLiked) {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        onLikeToggle?.(postData.id, true);
      } else {
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
        onLikeToggle?.(postData.id, false);
      }
      
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
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

      {/* Display image or video */}
      {showImage && postData.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: postData.imageUrl }} style={styles.image} />
        </View>
      )}

      {showImage && postData.videoUrl && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: postData.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            shouldPlay={false}
          />
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
    backgroundColor: COLORS.white,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    marginRight: RESPONSIVE_SPACING.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  moreButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  content: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    lineHeight: 22,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
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
    resizeMode: 'cover',
  },
  videoContainer: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.lg,
  },
  actionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.xs,
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