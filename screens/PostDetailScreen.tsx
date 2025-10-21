import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Heart, MessageCircle, Share, MoreVertical, Edit, Trash2, Calendar, User } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { postAPI, commentAPI, PostResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface PostDetailScreenProps {
  onLikeToggle?: (postId: number, isLiked: boolean) => void;
}

export default function PostDetailScreen({ onLikeToggle }: PostDetailScreenProps = {}) {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useAuth();
  const { updatePostLike } = usePostContext();
  const insets = useSafeAreaInsets();

  // Tags are already provided by backend in postData.tags
  // No need to fetch them separately

  const fetchPost = async () => {
    try {
      console.log('PostDetailScreen: Fetching post with ID:', postId);
      const postData = await postAPI.getPost(Number(postId));
      setPost(postData);
      
      // Initialize like state
      if (user?.id && postData.likes && Array.isArray(postData.likes)) {
        setIsLiked(postData.likes.some(like => like.userId === user.id));
      } else {
        setIsLiked(postData.isLiked || false);
      }
      setLikesCount(postData.likeCount || 0);
      
      console.log('PostDetailScreen: Post fetched successfully:', postData);
    } catch (error) {
      console.error('PostDetailScreen: Error fetching post:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLike = async () => {
    if (!post || !user?.id || isLoadingLike) return;

    try {
      setIsLoadingLike(true);
      
      if (isLiked) {
        console.log(`PostDetailScreen: Unliking post ${post.id} for user ${user.id}`);
        await postAPI.unlikePost(post.id, user.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onLikeToggle?.(post.id, false);
        updatePostLike(post.id, false);
        console.log(`PostDetailScreen: Successfully unliked post ${post.id}`);
      } else {
        console.log(`PostDetailScreen: Liking post ${post.id} for user ${user.id}`);
        await postAPI.likePost(post.id, user.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        onLikeToggle?.(post.id, true);
        updatePostLike(post.id, true);
        console.log(`PostDetailScreen: Successfully liked post ${post.id}`);
      }
    } catch (error: any) {
      console.error('PostDetailScreen: Error toggling like:', error);
      console.error('PostDetailScreen: Error details:', error.response?.data);
      console.error('PostDetailScreen: Error status:', error.response?.status);
      
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
      setIsLoadingLike(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!post || !user?.id || !commentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      
      console.log('PostDetailScreen: Submitting comment:', {
        postId: post.id,
        userId: user.id,
        content: commentText.trim()
      });

      const commentData = {
        postId: post.id,
        userId: user.id,
        content: commentText.trim()
      };

      console.log('PostDetailScreen: Comment data to send:', commentData);

      const newComment = await commentAPI.createComment(commentData);

      console.log('PostDetailScreen: Comment created successfully:', newComment);

      // Update post with new comment
      setPost(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newComment],
        commentCount: prev.commentCount + 1
      } : null);

      // Clear comment input
      setCommentText('');
      
      Alert.alert('Thành công', 'Bình luận đã được thêm!');
    } catch (error: any) {
      console.error('PostDetailScreen: Error submitting comment:', error);
      console.error('PostDetailScreen: Error details:', error.response?.data);
      console.error('PostDetailScreen: Error status:', error.response?.status);
      console.error('PostDetailScreen: Error message:', error.message);
      
      Alert.alert('Lỗi', 'Không thể thêm bình luận. Vui lòng thử lại.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !user?.id) return;

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
              setIsDeleting(true);
              await postAPI.deletePost(post.id);
              console.log('PostDetailScreen: Post deleted successfully');
              Alert.alert('Thành công', 'Bài viết đã được xóa.');
              router.back();
            } catch (error) {
              console.error('PostDetailScreen: Error deleting post:', error);
              Alert.alert('Lỗi', 'Không thể xóa bài viết. Vui lòng thử lại.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (!post) return;
    router.push('/(tabs)/create');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPost();
  };

  const formatDate = (dateString: string) => {
    try {
      console.log('PostDetailScreen: Raw date string from backend:', dateString);
      
      // Parse the date string
      let date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('PostDetailScreen: Invalid date string:', dateString);
        return 'Thời gian không hợp lệ';
      }
      
      console.log('PostDetailScreen: Parsed date (UTC):', date.toISOString());
      console.log('PostDetailScreen: Parsed date (Local):', date.toLocaleString('vi-VN'));
      
      // Based on the format "2025-10-15 13:40:29.414779", this appears to be UTC time
      // without timezone indicator, so we need to add 7 hours to get Vietnam time
      console.log('PostDetailScreen: Backend time appears to be UTC without timezone indicator');
      console.log('PostDetailScreen: Converting to Vietnam time (UTC+7)');
      
      // Add 7 hours to get Vietnam time
      const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      date = vietnamTime;
      
      console.log('PostDetailScreen: Final date (Vietnam time):', date.toLocaleString('vi-VN'));
      
      // Show actual time in Vietnamese format
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch (error) {
      console.error('PostDetailScreen: Error formatting date:', error);
      return 'Thời gian không hợp lệ';
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải bài viết...</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPost}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOwner = user?.id === post.userId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
        {isOwner ? (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Tùy chọn',
                'Chọn hành động',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Chỉnh sửa', onPress: handleEdit },
                  { text: 'Xóa', style: 'destructive', onPress: handleDelete },
                ]
              );
            }}
          >
            <MoreVertical size={24} color={COLORS.black} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              {post.user.avatarUrl ? (
                <Image source={{ uri: post.user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <User size={24} color={COLORS.white} />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{post.user.fullName}</Text>
              <Text style={styles.postDate}>
                <Calendar size={12} color={COLORS.gray} /> 
                Tạo lúc: {formatDate(post.createdAt)}
                {post.updatedAt !== post.createdAt && (
                  <Text style={styles.editDate}>
                    {'\n'}Chỉnh sửa lúc: {formatDate(post.updatedAt)}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Post Text */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Image */}
          {post.imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
            </View>
          )}

          {/* Post Video */}
          {post.videoUrl && (
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: post.videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                shouldPlay={false}
              />
            </View>
          )}

          {/* Tags */}
          {(() => {
            console.log('PostDetailScreen: Full post:', JSON.stringify(post, null, 2));
            console.log('PostDetailScreen: tags from backend:', post.tags);
            console.log('PostDetailScreen: tags length:', post.tags?.length);
            console.log('PostDetailScreen: tags type:', typeof post.tags);
            
            if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
              return (
                <View style={styles.tagsContainer}>
                  {post.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      #{tag?.name || 'Unknown Tag'}
                    </Text>
                  ))}
                </View>
              );
            }
            
            // Fallback: try to extract tags from content
            const tagMatches = post.content?.match(/#\w+/g);
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

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleLike}
              disabled={isLoadingLike}
            >
              <Heart 
                size={20} 
                color={isLiked ? COLORS.error : COLORS.gray} 
                fill={isLiked ? COLORS.error : 'none'}
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Scroll to comments section
                console.log('Scroll to comments');
              }}
            >
              <MessageCircle size={20} color={COLORS.gray} />
              <Text style={styles.actionText}>{post.commentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Share size={20} color={COLORS.gray} />
              <Text style={styles.actionText}>{post.shareCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Bình luận ({post.commentCount})</Text>
          
          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết bình luận..."
              placeholderTextColor={COLORS.gray}
              multiline
              value={commentText}
              onChangeText={setCommentText}
              editable={!isSubmittingComment}
            />
            <TouchableOpacity 
              style={[styles.sendCommentButton, (!commentText.trim() || isSubmittingComment) && styles.sendCommentButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.sendCommentText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {post.comments && post.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {post.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    {comment.user.avatarUrl ? (
                      <Image source={{ uri: comment.user.avatarUrl }} style={styles.commentAvatarImage} />
                    ) : (
                      <User size={16} color={COLORS.white} />
                    )}
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{comment.user.fullName}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
              <Text style={styles.noCommentsSubtext}>Hãy là người đầu tiên bình luận!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerButton: {
    padding: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  moreButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.lg,
  },
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
  },
  postContainer: {
    padding: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  postDate: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editDate: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  postContent: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  imageContainer: {
    marginBottom: RESPONSIVE_SPACING.md,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  videoContainer: {
    marginBottom: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  tag: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.xs,
  },
  actionButtonActive: {
    // Active state styling
  },
  actionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  actionTextActive: {
    color: COLORS.error,
  },
  commentsSection: {
    padding: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentsTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.black,
    marginRight: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
  },
  sendCommentButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  sendCommentButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  sendCommentText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
  },
  commentsList: {
    marginTop: RESPONSIVE_SPACING.sm,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  commentText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.lg,
  },
  noCommentsText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  noCommentsSubtext: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
