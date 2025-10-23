import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal, Trash2, Edit } from 'lucide-react-native';
import { PostResponse, postAPI, shareAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useRouter } from 'expo-router';
import ShareButton from './ShareButton';
import PostLikesModal from './PostLikesModal';

interface PostCardProps {
  postData: PostResponse;
  onPostUpdated?: (post: PostResponse) => void;
  onPostDeleted?: (postId: number) => void;
  onLikeToggle?: (postId: number, isLiked: boolean) => void;
  onShareToggle?: (postId: number, isShared: boolean) => void;
  onCommentCountUpdate?: (postId: number, commentCount: number) => void;
  onRefresh?: () => void;
  showImage?: boolean;
  isSharedPost?: boolean;
}

export default function PostCard({ 
  postData,
  onPostUpdated,
  onPostDeleted,
  onLikeToggle,
  onShareToggle,
  onCommentCountUpdate,
  onRefresh,
  showImage = true,
  isSharedPost = false
}: PostCardProps) {
  const { user } = useAuth();
  const { refreshPosts, updatePostLike, getPostLikeState, updatePostShare, getPostShareState } = usePostContext();
  const router = useRouter();
  
  // Get like state from context, fallback to postData
  const contextLikeState = getPostLikeState(postData.id);
  const [actualIsLiked, setActualIsLiked] = useState<boolean | null>(null);
  const isLiked = actualIsLiked ?? contextLikeState?.isLiked ?? postData.isLiked ?? false;
  const likeCount = contextLikeState?.likeCount ?? postData.likeCount ?? 0;

  // Get share state from context, fallback to postData
  const contextShareState = getPostShareState(postData.id);
  const isShared = contextShareState?.isShared ?? postData.isShared ?? false;
  const shareCount = contextShareState?.shareCount ?? postData.shareCount ?? 0;

  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isCheckingLikeStatus, setIsCheckingLikeStatus] = useState(false);

  // Video player setup
  const player = useVideoPlayer(postData.videoUrl || '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  // Check actual like status from API - only once per post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || actualIsLiked !== null) return; // Already checked or no user
      
      try {
        setIsCheckingLikeStatus(true);
        console.log(`🔍 [PostCard] Checking like status for post ${postData.id}`);
        
        const likesData = await postAPI.getPostLikes(postData.id);
        const userLiked = likesData.some(likeUser => likeUser.id === user.id);
        
        console.log(`✅ [PostCard] Like status for post ${postData.id}:`, userLiked);
        setActualIsLiked(userLiked);
        
        // Update context with correct status
        if (userLiked !== (postData.isLiked ?? false)) {
          updatePostLike(postData.id, userLiked);
        }
      } catch (error: any) {
        console.error(`❌ [PostCard] Error checking like status for post ${postData.id}:`, error);
        // If API fails, fall back to postData.isLiked
        setActualIsLiked(postData.isLiked ?? false);
      } finally {
        setIsCheckingLikeStatus(false);
      }
    };

    checkLikeStatus();
  }, [postData.id, user?.id]); // Removed actualIsLiked from dependencies to prevent infinite loop

  const handleLikeToggle = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await postAPI.unlikePost(postData.id, user.id);
        setActualIsLiked(false); // Update local state
        updatePostLike(postData.id, false); // Update context
        onLikeToggle?.(postData.id, false); // Callback for parent (no duplicate updatePostLike)
      } else {
        await postAPI.likePost(postData.id, user.id);
        setActualIsLiked(true); // Update local state
        updatePostLike(postData.id, true); // Update context
        onLikeToggle?.(postData.id, true); // Callback for parent (no duplicate updatePostLike)
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    } finally {
      setIsLiking(false);
    }
  };

  const handleLikeCountPress = () => {
    if (likeCount > 0) {
      setShowLikesModal(true);
    }
  };

  const handleShareToggle = async () => {
    if (!user || isSharing) return;

    setIsSharing(true);
    try {
      if (isShared) {
        await shareAPI.unsharePost(user.id, postData.id);
        updatePostShare(postData.id, false); // Update context
        onShareToggle?.(postData.id, false);
      } else {
        await shareAPI.sharePost(user.id, postData.id);
        updatePostShare(postData.id, true); // Update context
        onShareToggle?.(postData.id, true);
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || isDeleting) return;

    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await postAPI.deletePost(postData.id);
              onPostDeleted?.(postData.id);
              Alert.alert('Thành công', 'Bài viết đã được xóa');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Lỗi', 'Không thể xóa bài viết');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEditPost = () => {
    router.push({
      pathname: '/edit-post',
      params: {
        post: JSON.stringify(postData)
      }
    } as any);
  };

  const handleCommentPress = () => {
    router.push(`/post-detail?id=${postData.id}` as any);
  };

  const handleUserPress = () => {
    router.push(`/profile?id=${postData.userId}` as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const isOwner = user?.id === postData.userId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
          <Image
            source={{
              uri: postData.user.avatarUrl || 'https://via.placeholder.com/40'
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{postData.user.fullName}</Text>
            <Text style={styles.timestamp}>{formatDate(postData.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        
        {isOwner && (
          <TouchableOpacity style={styles.moreButton} onPress={() => {}}>
            <MoreHorizontal size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.postText}>
          {showFullContent ? postData.content : truncateContent(postData.content)}
        </Text>
        
        {postData.content.length > 150 && (
          <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
            <Text style={styles.readMore}>
              {showFullContent ? 'Thu gọn' : 'Đọc thêm'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media */}
      {showImage && postData.imageUrl && (
        <Image source={{ uri: postData.imageUrl }} style={styles.postImage} />
      )}
      
      {showImage && postData.videoUrl && (
        <View style={styles.videoContainer}>
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
        </View>
      )}

      {/* Tags */}
      {postData.tags && postData.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {postData.tags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={handleLikeToggle}
            disabled={isLiking || isCheckingLikeStatus}
          >
            {isCheckingLikeStatus ? (
              <ActivityIndicator size={16} color={COLORS.text.secondary} />
            ) : (
              <Heart 
                size={20} 
                color={isLiked ? COLORS.accent.primary : COLORS.text.secondary}
                fill={isLiked ? COLORS.accent.primary : 'none'}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionTextContainer}
            onPress={handleLikeCountPress}
            disabled={likeCount === 0}
          >
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
          <MessageCircle size={20} color={COLORS.text.secondary} />
          <Text style={styles.actionText}>{postData.commentCount}</Text>
        </TouchableOpacity>

        <ShareButton
          postId={postData.id}
          shareCount={shareCount}
          isShared={isShared}
          onShareToggle={onShareToggle}
          disabled={isSharing}
        />
      </View>

      {/* Owner Actions */}
      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity 
            style={styles.ownerActionButton} 
            onPress={handleEditPost}
          >
            <Edit size={16} color={COLORS.accent.primary} />
            <Text style={styles.ownerActionText}>Chỉnh sửa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.ownerActionButton} 
            onPress={handleDeletePost}
            disabled={isDeleting}
          >
            <Trash2 size={16} color={COLORS.accent.danger} />
            <Text style={[styles.ownerActionText, { color: COLORS.accent.danger }]}>
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Likes Modal */}
      <PostLikesModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={postData.id}
        likeCount={likeCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    marginVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: RESPONSIVE_SPACING.md,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  timestamp: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  moreButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  content: {
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  postText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  readMore: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.accent.primary,
    fontWeight: '500',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.accent.primary + '20',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  tagText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.accent.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  actionIcon: {
    padding: RESPONSIVE_SPACING.xs,
  },
  actionTextContainer: {
    padding: RESPONSIVE_SPACING.xs,
  },
  actionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  actionTextActive: {
    color: COLORS.accent.primary,
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.secondary,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  ownerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  ownerActionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.accent.primary,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
});