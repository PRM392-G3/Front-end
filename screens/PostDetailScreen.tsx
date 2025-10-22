import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { X, Send, Edit, Trash2 } from 'lucide-react-native';
import { PostResponse, commentAPI, Comment, postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import TagInput from '@/components/TagInput';
import PostCard from '@/components/PostCard';
import { useLocalSearchParams } from 'expo-router';

interface PostDetailScreenProps {
  postId?: number;
  onShareToggle?: (postId: number, isShared: boolean) => void;
  onRefresh?: () => void;
  onCommentCountUpdate?: (postId: number, commentCount: number) => void;
}

export default function PostDetailScreen({
  postId: propPostId,
  onShareToggle,
  onRefresh,
  onCommentCountUpdate,
}: PostDetailScreenProps) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { updatePost, updatePostLike, updatePostShare, getPost } = usePostContext();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Get postId from URL params or props
  const postId = propPostId || (id ? parseInt(id) : null);

  // Create post state
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    if (!postId) {
      console.error('PostDetailScreen: No postId provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🚀 [PostDetail] Loading post ${postId}`);
      
      // Try to get post from context first
      const contextPost = getPost(postId);
      if (contextPost) {
        console.log(`✅ [PostDetail] Found post in context:`, contextPost);
        setPost(contextPost);
        await loadComments(postId);
        return;
      }

      // If not in context, fetch from API
      console.log(`🔄 [PostDetail] Post not in context, fetching from API...`);
      const fetchedPost = await postAPI.getPost(postId);
      console.log(`✅ [PostDetail] Fetched post from API:`, fetchedPost);
      setPost(fetchedPost);
      await loadComments(postId);
      
    } catch (error: any) {
      console.error('❌ [PostDetail] Error loading post:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (postId: number) => {
    try {
      console.log(`🚀 [PostDetail] Loading comments for post ${postId}`);
      const commentsData = await commentAPI.getCommentsByPost(postId);
      console.log(`✅ [PostDetail] Comments loaded:`, commentsData);
      setComments(commentsData);
    } catch (error: any) {
      console.error('❌ [PostDetail] Error loading comments:', error);
      // Don't show alert for comments loading error, just log it
    }
  };

  const handleAddComment = async () => {
    if (!user || !post || !newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const comment = await commentAPI.createComment({
        postId: post.id,
        content: newComment.trim(),
        userId: user.id,
      });

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // Update comment count
      const newCommentCount = comments.length + 1;
      onCommentCountUpdate?.(post.id, newCommentCount);
      updatePost(post.id, { commentCount: newCommentCount });
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editCommentText.trim() || !user || isCommenting) return;

    setIsCommenting(true);
    try {
      const updatedComment = await commentAPI.updateComment(commentId, {
        content: editCommentText.trim()
      });

      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      setEditingComment(null);
      setEditCommentText('');
    } catch (error: any) {
      console.error('Error editing comment:', error);
      Alert.alert('Lỗi', 'Không thể chỉnh sửa bình luận');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    Alert.alert(
      'Xóa bình luận',
      'Bạn có chắc chắn muốn xóa bình luận này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentAPI.deleteComment(commentId);
              
              setComments(prev => prev.filter(comment => comment.id !== commentId));
              
              // Update comment count
              if (post) {
                const updatedPost = { ...post, commentCount: Math.max(0, post.commentCount - 1) };
                setPost(updatedPost);
                updatePost(post.id, updatedPost);
                onCommentCountUpdate?.(post.id, updatedPost.commentCount);
              }
            } catch (error: any) {
              console.error('Error deleting comment:', error);
              Alert.alert('Lỗi', 'Không thể xóa bình luận');
            }
          }
        }
      ]
    );
  };

  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleCreatePost = async () => {
    if (!user || !postContent.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Mock post creation - in real app, you'd call postAPI.createPost
      const newPost: PostResponse = {
        id: Date.now(),
        userId: user.id,
        content: postContent,
        imageUrl: selectedImages[0],
        videoUrl: selectedVideo || undefined,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isPublic: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: user,
        comments: [],
        likes: [],
        shares: [],
        tags: selectedTags.map(tag => ({
          id: Date.now(),
          name: tag,
          description: '',
          usageCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        isLiked: false,
        isShared: false,
      };

      // Reset form
      setPostContent('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setSelectedTags([]);
      setShowCreatePost(false);

      Alert.alert('Thành công', 'Bài viết đã được tạo');
      onRefresh?.();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Lỗi', 'Không thể tạo bài viết');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
      </View>
    );
  }

  if (showCreatePost) {
    return (
      <View style={styles.createPostContainer}>
        <View style={styles.createPostHeader}>
          <TouchableOpacity onPress={() => setShowCreatePost(false)}>
            <X size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.createPostTitle}>Tạo bài viết</Text>
          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={!postContent.trim() || isCreating}
          >
            <Text style={[
              styles.createPostButton,
              (!postContent.trim() || isCreating) && styles.createPostButtonDisabled
            ]}>
              {isCreating ? 'Đang tạo...' : 'Đăng'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.createPostContent}>
          <TextInput
            style={styles.postInput}
            value={postContent}
            onChangeText={setPostContent}
            placeholder="Bạn đang nghĩ gì?"
            multiline
            textAlignVertical="top"
          />

          <ImageUploader
            onUploadComplete={(result) => setSelectedImages([result.publicUrl])}
            folder="posts"
            maxImages={1}
          />

          <VideoUploader
            onUploadComplete={(result) => setSelectedVideo(result.publicUrl)}
            folder="posts"
            maxVideos={1}
          />

          <TagInput
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            placeholder="Thêm hashtag..."
            maxTags={5}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Post Card */}
        {post && (
          <PostCard
            postData={post}
            onPostUpdated={(updatedPost) => {
              setPost(updatedPost);
              updatePost(updatedPost.id, updatedPost);
            }}
            onPostDeleted={(postId) => {
              // Handle post deletion if needed
            }}
            onLikeToggle={(postId, isLiked) => {
              setPost(prev => prev ? {
                ...prev,
                isLiked,
                likeCount: isLiked ? prev.likeCount + 1 : prev.likeCount - 1
              } : null);
              // PostCard already calls updatePostLike, so we don't need to call it again
            }}
            onShareToggle={(postId, isShared) => {
              setPost(prev => prev ? {
                ...prev,
                isShared,
                shareCount: isShared ? prev.shareCount + 1 : prev.shareCount - 1
              } : null);
              // PostCard already calls updatePostShare, so we don't need to call it again
              onShareToggle?.(postId, isShared);
            }}
            onCommentCountUpdate={onCommentCountUpdate}
            showImage={true}
          />
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
          
          {/* Add Comment */}
          {user && (
            <View style={styles.addCommentContainer}>
              <Image
                source={{ uri: user.avatarUrl || 'https://via.placeholder.com/32' }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Viết bình luận..."
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newComment.trim() || isCommenting) && styles.sendButtonDisabled
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isCommenting}
                >
                  <Send size={16} color={COLORS.text.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.user.avatarUrl || 'https://via.placeholder.com/32' }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUserName}>{comment.user.fullName}</Text>
                      <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                      {user && comment.user.id === user.id && (
                        <View style={styles.commentActions}>
                          <TouchableOpacity 
                            onPress={() => startEditComment(comment)}
                            style={styles.commentActionButton}
                          >
                            <Edit size={14} color={COLORS.text.secondary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeleteComment(comment.id)}
                            style={styles.commentActionButton}
                          >
                            <Trash2 size={14} color={COLORS.accent.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    {editingComment === comment.id ? (
                      <View style={styles.editCommentContainer}>
                        <TextInput
                          style={styles.editCommentInput}
                          value={editCommentText}
                          onChangeText={setEditCommentText}
                          multiline
                          maxLength={500}
                        />
                        <View style={styles.editCommentButtons}>
                          <TouchableOpacity 
                            onPress={cancelEditComment}
                            style={styles.editCommentButton}
                          >
                            <Text style={styles.editCommentButtonText}>Hủy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleEditComment(comment.id)}
                            disabled={!editCommentText.trim() || isCommenting}
                            style={[styles.editCommentButton, styles.editCommentButtonPrimary]}
                          >
                            <Text style={[styles.editCommentButtonText, styles.editCommentButtonTextPrimary]}>
                              Lưu
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.commentText}>{comment.content}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>Chưa có bình luận nào</Text>
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
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
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
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  postDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  postContent: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  postText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    lineHeight: 22,
    marginBottom: RESPONSIVE_SPACING.sm,
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
  videoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: RESPONSIVE_SPACING.sm,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent.primary,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  actionButton: {
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  commentsSection: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  commentsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  commentInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: COLORS.background.secondary,
  },
  sendButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.sm,
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.text.secondary,
  },
  commentsList: {
    gap: RESPONSIVE_SPACING.sm,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.secondary,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  commentUserName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentActionButton: {
    padding: RESPONSIVE_SPACING.xs,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  editCommentContainer: {
    marginTop: RESPONSIVE_SPACING.xs,
  },
  editCommentInput: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editCommentButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.sm,
  },
  editCommentButton: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  editCommentButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  editCommentButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  editCommentButtonTextPrimary: {
    color: COLORS.text.white,
  },
  commentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  emptyComments: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.lg,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  createPostContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  createPostTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  createPostButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  createPostButtonDisabled: {
    opacity: 0.5,
  },
  createPostContent: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  postInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});