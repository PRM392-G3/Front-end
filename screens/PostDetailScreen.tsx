import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { X, Send } from 'lucide-react-native';
import { PostResponse, commentAPI, Comment } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import TagInput from '@/components/TagInput';

interface PostDetailScreenProps {
  postId?: number;
  onShareToggle?: (postId: number, isShared: boolean) => void;
  onRefresh?: () => void;
  onCommentCountUpdate?: (postId: number, commentCount: number) => void;
}

export default function PostDetailScreen({
  postId,
  onShareToggle,
  onRefresh,
  onCommentCountUpdate,
}: PostDetailScreenProps) {
  const { user } = useAuth();
  const { updatePost, getPost } = usePostContext();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);

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
    try {
      setIsLoading(true);
      // For now, we'll use mock data since we don't have a specific post endpoint
      const mockPost: PostResponse = {
        id: postId || 1,
        userId: 1,
        content: 'This is a sample post content for testing purposes.',
        likeCount: 10,
        commentCount: 5,
        shareCount: 2,
        isPublic: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: 1,
          email: 'test@example.com',
          fullName: 'Test User',
          avatarUrl: 'https://via.placeholder.com/40',
          coverImageUrl: null,
          phoneNumber: '0123456789',
          bio: 'Test bio',
          dateOfBirth: null,
          location: null,
          isActive: true,
          emailVerifiedAt: null,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          followersCount: 100,
          followingCount: 50,
          postsCount: 25,
          isFollowing: false,
        },
        comments: [],
        likes: [],
        shares: [],
        tags: [],
        isLiked: false,
        isShared: false,
      };
      
      setPost(mockPost);
      setComments(mockPost.comments || []);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết');
    } finally {
      setIsLoading(false);
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
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image source={{ uri: post.user.avatarUrl || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{post.user.fullName}</Text>
              <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postText}>{post.content}</Text>
          
          {/* Post Media */}
          {post.imageUrl && (
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
          )}
          
          {post.videoUrl && (
            <View style={styles.videoContainer}>
              <Text style={styles.videoText}>Video: {post.videoUrl}</Text>
            </View>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <TouchableOpacity key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>👍 {post.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>💬 {post.commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>🔄 {post.shareCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Bình luận ({comments.length})</Text>
          
          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Viết bình luận..."
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleAddComment}
              disabled={!newComment.trim() || isCommenting}
            >
              <Send size={20} color={COLORS.accent.primary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.user.avatarUrl || 'https://via.placeholder.com/30' }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{comment.user.fullName}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
            )}
          </View>
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
    alignItems: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    marginRight: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  commentsList: {
    gap: RESPONSIVE_SPACING.sm,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  commentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginVertical: RESPONSIVE_SPACING.xs,
  },
  commentDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  noCommentsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: RESPONSIVE_SPACING.lg,
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