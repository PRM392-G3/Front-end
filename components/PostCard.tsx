import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal, Trash2, Edit } from 'lucide-react-native';
import { PostResponse, postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
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
  const { user } = useAuth();
  const { getPostLikeState } = usePostContext();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(() => {
    // Check global context first, then fallback to post data
    const globalLikeState = getPostLikeState(postData.id);
    if (globalLikeState) {
      return globalLikeState.isLiked;
    }
    return postData.isLiked || false;
  });
  const [likesCount, setLikesCount] = useState(() => {
    const globalLikeState = getPostLikeState(postData.id);
    if (globalLikeState) {
      return globalLikeState.likeCount;
    }
    return postData.likeCount;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isApiCalling, setIsApiCalling] = useState(false);

  const isOwnPost = user?.id === postData.userId;

  // Sync state when postData changes or global state changes
  useEffect(() => {
    // Check global context first
    const globalLikeState = getPostLikeState(postData.id);
    if (globalLikeState) {
      setIsLiked(globalLikeState.isLiked);
      setLikesCount(globalLikeState.likeCount);
    } else {
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData.likeCount);
    }
  }, [postData.isLiked, postData.likeCount, getPostLikeState]);

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
    console.log('PostCard: Navigating to post detail for post ID:', postData.id);
    
    // Validate postId before navigation
    if (!postData.id || isNaN(Number(postData.id))) {
      console.error('PostCard: Invalid postId for navigation:', postData.id);
      Alert.alert('Lỗi', 'Không thể mở bài viết. ID không hợp lệ.');
      return;
    }
    
    try {
      router.push({
        pathname: '/post-detail',
        params: { id: postData.id.toString() }
      });
    } catch (error) {
      console.error('PostCard: Navigation failed:', error);
    }
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
    if (isLoading || isApiCalling) return;
    
    const wasLiked = isLiked;
    console.log('PostCard: Toggling like for post:', postData.id, 'wasLiked:', wasLiked);

    try {
      setIsLoading(true);
      setIsApiCalling(true);
      
      // Optimistically update UI
      if (isLiked) {
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }

      // Make API call
      if (wasLiked) {
        await postAPI.unlikePost(postData.id, user?.id || 0);
      } else {
        await postAPI.likePost(postData.id, user?.id || 0);
      }

      // Update global state after successful API call
      onLikeToggle?.(postData.id, !wasLiked);
        } catch (error: any) {
          console.error('PostCard: Error toggling like:', error);
          
          // Handle specific error cases
          if (error.response?.status === 401) {
            // Revert UI state for 401
            if (wasLiked) {
              setLikesCount(prev => prev + 1);
              setIsLiked(true);
            } else {
              setLikesCount(prev => Math.max(0, prev - 1));
              setIsLiked(false);
            }
            
            Alert.alert(
              'Phiên đăng nhập hết hạn',
              'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
              [
                { text: 'Đăng nhập lại', onPress: () => {
                  router.push('/auth/login');
                }}
              ]
            );
          } else if (error.response?.status === 400) {
            // For 400, the backend indicates the action was redundant (already liked/unliked)
            // Don't revert UI state - just refresh data to ensure sync
            console.log('PostCard: Handling 400 error - refreshing post data to sync state');
            // The UI state is already correct, just refresh to ensure backend sync
            setTimeout(() => {
              // Trigger a refresh by calling onLikeToggle with current state
              onLikeToggle?.(postData.id, !wasLiked);
            }, 100);
          } else {
            // Revert UI state for other errors
            if (wasLiked) {
              setLikesCount(prev => prev + 1);
              setIsLiked(true);
            } else {
              setLikesCount(prev => Math.max(0, prev - 1));
              setIsLiked(false);
            }
            
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
          }
        } finally {
      setIsLoading(false);
      setIsApiCalling(false);
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
          disabled={isLoading || isApiCalling}
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