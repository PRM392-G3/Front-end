import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, User, TrendingUp } from 'lucide-react-native';
import { postAPI, shareAPI, PostResponse } from '@/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';

interface SuggestedPostsProps {
  userId: number;
  limit?: number;
  onPostPress?: (postId: number) => void;
}

export const SuggestedPosts: React.FC<SuggestedPostsProps> = ({ 
  userId, 
  limit = 10,
  onPostPress 
}) => {
  const [suggestedPosts, setSuggestedPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { 
    updatePostLike,
    updatePostShare,
    updatePostComment,
    getPostLikeState,
    getPostShareState,
    getPostCommentState,
    syncPostState,
    getSyncedPost
  } = usePostContext();
  const router = useRouter();

  const loadSuggestedPosts = async () => {
    try {
      setLoading(true);
      console.log(`🔍 [SuggestedPosts] Loading suggested posts for user: ${userId}`);
      
      // Get all posts with likes
      const allPosts = await postAPI.getAllPostsWithLikes();
      
      // Filter out user's own posts
      const otherPosts = allPosts.filter(post => post.userId !== userId);
      
      // Sort by engagement using PostContext data
      const sortedPosts = otherPosts.sort((a, b) => {
        const likeStateA = getPostLikeState(a.id) || { likeCount: a.likeCount };
        const likeStateB = getPostLikeState(b.id) || { likeCount: b.likeCount };
        const shareStateA = getPostShareState(a.id) || { shareCount: a.shareCount };
        const shareStateB = getPostShareState(b.id) || { shareCount: b.shareCount };
        const commentStateA = getPostCommentState(a.id) || { commentCount: a.commentCount };
        const commentStateB = getPostCommentState(b.id) || { commentCount: b.commentCount };
        
        const engagementA = likeStateA.likeCount + commentStateA.commentCount + shareStateA.shareCount;
        const engagementB = likeStateB.likeCount + commentStateB.commentCount + shareStateB.shareCount;
        return engagementB - engagementA;
      });
      
      // Take top posts
      const topPosts = sortedPosts.slice(0, limit);
      
      setSuggestedPosts(topPosts);
      console.log(`✅ [SuggestedPosts] Loaded ${topPosts.length} suggested posts with PostContext sync`);
    } catch (error: any) {
      console.error('❌ [SuggestedPosts] Error loading suggested posts:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết gợi ý');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestedPosts();
  }, [userId]);

  // Sync post states when PostContext changes
  useEffect(() => {
    if (suggestedPosts.length > 0) {
      // Update posts with synced state from context
      const updatedPosts = suggestedPosts.map(post => {
        const syncedPost = getSyncedPost(post.id);
        if (syncedPost) {
          return syncedPost;
        }
        return post;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedPosts.some((post, index) => 
        post.isLiked !== suggestedPosts[index].isLiked ||
        post.isShared !== suggestedPosts[index].isShared ||
        post.likeCount !== suggestedPosts[index].likeCount ||
        post.shareCount !== suggestedPosts[index].shareCount ||
        post.commentCount !== suggestedPosts[index].commentCount
      );
      
      if (hasChanges) {
        setSuggestedPosts(updatedPosts);
      }
    }
  }, [getSyncedPost]);


  const handlePostPress = (postId: number) => {
    if (onPostPress) {
      onPostPress(postId);
    } else {
      router.push(`/post-detail?id=${postId}` as any);
    }
  };

  const handleUserPress = (userId: number) => {
    router.push(`/profile?userId=${userId}` as any);
  };

  const handleLike = async (postId: number) => {
    if (!user?.id) return;
    
    try {
      const likeState = getPostLikeState(postId) || { isLiked: false, likeCount: 0 };
      if (likeState.isLiked) {
        await postAPI.unlikePost(postId, user.id);
        updatePostLike(postId, false);
      } else {
        await postAPI.likePost(postId, user.id);
        updatePostLike(postId, true);
      }
    } catch (error) {
      console.error('❌ [SuggestedPosts] Error handling like:', error);
    }
  };

  const handleShare = async (postId: number) => {
    if (!user?.id) return;
    
    try {
      const shareState = getPostShareState(postId) || { isShared: false, shareCount: 0 };
      if (shareState.isShared) {
        await shareAPI.unsharePost(user.id, postId);
        updatePostShare(postId, false);
      } else {
        await shareAPI.sharePost(user.id, postId, '');
        updatePostShare(postId, true);
      }
    } catch (error) {
      console.error('❌ [SuggestedPosts] Error handling share:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderPost = ({ item }: { item: PostResponse }) => {
    const likeState = getPostLikeState(item.id) || { isLiked: false, likeCount: item.likeCount };
    const shareState = getPostShareState(item.id) || { isShared: false, shareCount: item.shareCount };
    
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handlePostPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => handleUserPress(item.userId)}
            activeOpacity={0.7}
          >
            {item.user.avatarUrl ? (
              <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={20} color={COLORS.white} />
              </View>
            )}
            <View style={styles.userDetails}>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>{item.user.fullName}</Text>
                {item.group && (
                  <>
                    <Text style={styles.groupSeparator}> đã đăng trong </Text>
                    <TouchableOpacity onPress={() => router.push(`/group-detail?id=${item.groupId}` as any)}>
                      <Text style={styles.groupName}>{item.group.name}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.trendingBadge}>
            <TrendingUp size={14} color={COLORS.primary} />
            <Text style={styles.trendingText}>Nổi bật</Text>
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postText} numberOfLines={3}>
            {item.content}
          </Text>
          
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          )}
        </View>

        {/* Post Stats */}
        <View style={styles.postStats}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Heart 
              size={16} 
              color={likeState.isLiked ? COLORS.primary : COLORS.gray} 
              fill={likeState.isLiked ? COLORS.primary : 'none'}
            />
            <Text style={[
              styles.statText,
              likeState.isLiked && styles.activeStatText
            ]}>
              {likeState.likeCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => handlePostPress(item.id)}
            activeOpacity={0.7}
          >
            <MessageCircle size={16} color={COLORS.gray} />
            <Text style={styles.statText}>{item.commentCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => handleShare(item.id)}
            activeOpacity={0.7}
          >
            <Share2 
              size={16} 
              color={shareState.isShared ? COLORS.primary : COLORS.gray}
            />
            <Text style={[
              styles.statText,
              shareState.isShared && styles.activeStatText
            ]}>
              {shareState.shareCount}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Không có bài viết gợi ý</Text>
      <Text style={styles.emptySubtitle}>
        Hãy theo dõi thêm người dùng để xem bài viết mới
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bài viết gợi ý...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài viết nổi bật</Text>
        <Text style={styles.subtitle}>Dựa trên xu hướng và tương tác</Text>
      </View>
      
      <FlatList
        data={suggestedPosts}
        renderItem={renderPost}
        keyExtractor={(item, index) => `suggested-post-${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  listContainer: {
    padding: RESPONSIVE_SPACING.md,
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.md,
    padding: RESPONSIVE_SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  groupSeparator: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  postTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendingText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  postContent: {
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  postText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
    resizeMode: 'cover',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.lg,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  activeStatText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
