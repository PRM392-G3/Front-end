import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal, Trash2, Edit } from 'lucide-react-native';
import { PostResponse, postAPI, shareAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useRouter } from 'expo-router';
import ShareButton from './ShareButton';
import PostLikesModal from './PostLikesModal';
import FloatingCommentModal from './FloatingCommentModal';
import UserPreviewFloating from './UserPreviewFloating';
import { commentAPI } from '@/services/api';
import { explainTextInVietnamese } from '@/services/ai';

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
  const { 
    refreshPosts, 
    updatePostLike, 
    getPostLikeState, 
    updatePostShare, 
    getPostShareState,
    updatePostComment,
    getPostCommentState,
    syncPostState,
    getSyncedPost
  } = usePostContext();
  const router = useRouter();
  
  // Get synced post state from context
  const syncedPost = getSyncedPost(postData.id) || postData;
  
  // Get like state from context, fallback to synced post data
  const contextLikeState = getPostLikeState(postData.id);
  const isLiked = contextLikeState?.isLiked ?? syncedPost.isLiked ?? false;
  const likeCount = contextLikeState?.likeCount ?? syncedPost.likeCount ?? 0;

  // Get share state from context, fallback to synced post data
  const contextShareState = getPostShareState(postData.id);
  const isShared = contextShareState?.isShared ?? syncedPost.isShared ?? false;
  const shareCount = contextShareState?.shareCount ?? syncedPost.shareCount ?? 0;

  // Get comment state from context, fallback to synced post data
  const contextCommentState = getPostCommentState(postData.id);
  const commentCount = contextCommentState?.commentCount ?? syncedPost.commentCount ?? 0;

  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showUserPreview, setShowUserPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Video player setup
  const player = useVideoPlayer(postData.videoUrl || '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  // Initialize post state in context when component mounts
  useEffect(() => {
    if (postData.id) {
      syncPostState(postData.id, {
        isLiked: postData.isLiked,
        isShared: postData.isShared,
        likeCount: postData.likeCount,
        shareCount: postData.shareCount,
        commentCount: postData.commentCount
      });
    }
  }, [postData.id, postData.isLiked, postData.isShared, postData.likeCount, postData.shareCount, postData.commentCount, syncPostState]);

  const handleLikeToggle = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await postAPI.unlikePost(postData.id, user.id);
        updatePostLike(postData.id, false); // Update context
        onLikeToggle?.(postData.id, false); // Callback for parent
        console.log(`✅ [PostCard] Unliked post ${postData.id}`);
      } else {
        await postAPI.likePost(postData.id, user.id);
        updatePostLike(postData.id, true); // Update context
        onLikeToggle?.(postData.id, true); // Callback for parent
        console.log(`✅ [PostCard] Liked post ${postData.id}`);
      }
      
      // Refresh posts to ensure consistency across screens
      refreshPosts();
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert context change on error
      updatePostLike(postData.id, isLiked);
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
      
      // Refresh posts to ensure consistency across screens
      refreshPosts();
      
    } catch (error) {
      console.error('Error toggling share:', error);
      // Revert context change on error
      updatePostShare(postData.id, isShared);
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
    // Open floating comment modal instead of navigating
    setShowCommentModal(true);
  };

  const handleExplainWithAI = async () => {
    if (!postData || !postData.content) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiModalVisible(true);
    try {
      const result = await explainTextInVietnamese(postData.content);
      setAiResult(result);
    } catch (error: any) {
      console.error('AI explain error:', error);
      setAiError(error?.message || 'Lỗi khi gọi AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUserPress = () => {
    // Show floating preview instead of navigating directly
    setShowUserPreview(true);
  };

  const handlePostPress = () => {
    router.push(`/post-detail?id=${postData.id}` as any);
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

  const handleGroupPress = () => {
    if (postData.groupId && postData.group) {
      console.log('🏠 [PostCard] Navigating to group:', postData.group.name, 'ID:', postData.groupId);
      router.push(`/group-detail?id=${postData.groupId}` as any);
    }
  };

  // Helper to get user info - handle both old and new formats
  const getUserInfo = () => {
    // Try to get from user object (legacy format)
    if (postData.user && postData.user.fullName) {
      return {
        name: postData.user.fullName,
        avatar: postData.user.avatarUrl || null
      };
    }
    // Fallback to try to get from postData directly (optimized format)
    // This handles the case where user data might be missing
    return {
      name: 'Người dùng',
      avatar: null
    };
  };

  const userInfo = getUserInfo();

  // Debug: Log post data to check user info
  console.log('🔍 [PostCard] Post data:', {
    id: postData.id,
    hasUser: !!postData.user,
    userName: userInfo.name,
    hasGroup: !!postData.group,
    hasGroupId: !!postData.groupId,
    groupId: postData.groupId,
    groupName: postData.group?.name
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
          <Image
            source={{
              uri: userInfo.avatar || 'https://via.placeholder.com/40'
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{userInfo.name}</Text>
              {/* Hiển thị thông tin nhóm nếu là bài viết từ nhóm */}
              {postData.group && postData.groupId && (
                <Text style={styles.groupInfo}>
                  <Text style={styles.separator}> đã đăng trong </Text>
                  <TouchableOpacity onPress={handleGroupPress} activeOpacity={0.7}>
                    <Text style={styles.groupName}>{postData.group.name}</Text>
                  </TouchableOpacity>
                </Text>
              )}
            </View>
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
      <TouchableOpacity style={styles.content} onPress={handlePostPress}>
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
      </TouchableOpacity>

      {/* Media */}
      {showImage && postData.imageUrl && (
        <TouchableOpacity onPress={handlePostPress}>
          <Image source={{ uri: postData.imageUrl }} style={styles.postImage} />
        </TouchableOpacity>
      )}
      
      {showImage && postData.videoUrl && (
        <TouchableOpacity onPress={handlePostPress}>
          <View style={styles.videoContainer}>
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        </TouchableOpacity>
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
            disabled={isLiking}
          >
            {isLiking ? (
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
          <Text style={styles.actionText}>{commentCount}</Text>
        </TouchableOpacity>

        <ShareButton
          postId={postData.id}
          shareCount={shareCount}
          isShared={isShared}
          onShareToggle={onShareToggle}
          disabled={isSharing}
        />

        {/* Gemini-like AI button */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleExplainWithAI}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <Text style={styles.aiButtonText}>AI</Text>
          )}
        </TouchableOpacity>
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

      {/* AI Explanation Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.aiModalContainer}>
          <View style={styles.aiModalContent}>
            <Text style={styles.aiTitle}>Giải thích bằng AI</Text>
            {aiLoading ? (
              <ActivityIndicator size={24} color={COLORS.text.secondary} />
            ) : aiError ? (
              <Text style={{ color: COLORS.accent.danger }}>{aiError}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={{ color: COLORS.text.primary, lineHeight: 20 }}>
                  {aiResult}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.aiCloseButton}
              onPress={() => {
                setAiModalVisible(false);
                setAiResult(null);
                setAiError(null);
              }}
            >
              <Text style={styles.aiCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Comment Modal - Facebook style */}
      <FloatingCommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        postId={postData.id}
        postOwnerId={postData.userId}
        onCommentAdded={async () => {
          // Update comment count in context by reloading comments
          try {
            const comments = await commentAPI.getCommentsByPost(postData.id);
            updatePostComment(postData.id, comments.length);
          } catch (error) {
            console.error('Error updating comment count:', error);
          }
        }}
      />

      {/* User Preview Floating Modal */}
      <UserPreviewFloating
        visible={showUserPreview}
        onClose={() => setShowUserPreview(false)}
        userId={postData.userId}
        isCurrentUser={user?.id === postData.userId}
        onUserPress={(userId) => {
          // If navigating to current user's own profile, use replace to ensure reload
          if (user?.id === userId) {
            router.replace({ pathname: '/profile', params: { userId: userId.toString() } } as any);
          } else {
            router.push({ pathname: '/profile', params: { userId: userId.toString() } } as any);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    // Facebook-style: no border radius, cleaner look
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
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  groupInfo: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginTop: 2,
  },
  separator: {
    color: COLORS.text.secondary,
  },
  groupName: {
    fontWeight: '600',
    color: COLORS.accent.primary,
    textDecorationLine: 'underline',
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
    marginTop: RESPONSIVE_SPACING.xs,
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB', // Facebook border color
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
    fontSize: 15,
    color: COLORS.text.secondary,
    marginLeft: RESPONSIVE_SPACING.xs,
    fontWeight: '600',
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
  aiButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: RESPONSIVE_FONT_SIZES.sm,
  },
  aiModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
  },
  aiModalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  aiTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: RESPONSIVE_SPACING.sm,
    color: COLORS.text.primary,
  },
  aiCloseButton: {
    marginTop: RESPONSIVE_SPACING.md,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.border.secondary,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  aiCloseText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
});