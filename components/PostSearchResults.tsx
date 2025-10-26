import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, User, Calendar } from 'lucide-react-native';
import { postAPI, shareAPI, PostResponse } from '@/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';

interface PostSearchResultsProps {
  searchQuery: string;
  onPostPress?: (postId: number) => void;
}

export const PostSearchResults: React.FC<PostSearchResultsProps> = ({ 
  searchQuery, 
  onPostPress 
}) => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const searchPosts = useCallback(async (query: string, pageNum: number = 1, isRefresh: boolean = false) => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      console.log(`🔍 [PostSearch] Searching posts for: "${query}", page: ${pageNum}`);
      
      // TODO: Implement post search API
      // For now, we'll use getAllPostsWithLikes and filter client-side
      const allPosts = await postAPI.getAllPostsWithLikes();
      
      // Filter posts by content (simple text search)
      const filteredPosts = allPosts.filter(post => 
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.user.fullName.toLowerCase().includes(query.toLowerCase())
      );

      // Remove duplicates based on post ID
      const uniquePosts = filteredPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );

      // Sort by engagement using PostContext data
      const sortedPosts = uniquePosts.sort((a, b) => {
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

      if (isRefresh) {
        setPosts(sortedPosts);
        setPage(1);
      } else {
        // For pagination, we'll just set the posts directly since we're filtering all posts
        setPosts(sortedPosts);
        setPage(pageNum);
      }

      setHasMore(false); // Since we're filtering all posts, no more pages
      console.log(`✅ [PostSearch] Found ${uniquePosts.length} unique posts`);
    } catch (error: any) {
      console.error('❌ [PostSearch] Search error:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPosts(searchQuery, 1, true);
      } else {
        setPosts([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Sync post states when PostContext changes
  useEffect(() => {
    if (posts.length > 0) {
      // Update posts with synced state from context
      const updatedPosts = posts.map(post => {
        const syncedPost = getSyncedPost(post.id);
        if (syncedPost) {
          return syncedPost;
        }
        return post;
      });
      
      // Only update if there are actual changes
      const hasChanges = updatedPosts.some((post, index) => 
        post.isLiked !== posts[index].isLiked ||
        post.isShared !== posts[index].isShared ||
        post.likeCount !== posts[index].likeCount ||
        post.shareCount !== posts[index].shareCount ||
        post.commentCount !== posts[index].commentCount
      );
      
      if (hasChanges) {
        setPosts(updatedPosts);
      }
    }
  }, [getSyncedPost]);

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      searchPosts(searchQuery, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && searchQuery.trim()) {
      searchPosts(searchQuery, page + 1, false);
    }
  };

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
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (error) {
      console.error('❌ [PostSearch] Error handling like:', error);
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
      console.error('❌ [PostSearch] Error handling share:', error);
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
      <Text style={styles.emptyTitle}>Không tìm thấy bài viết</Text>
      <Text style={styles.emptySubtitle}>
        Thử tìm kiếm với từ khóa khác
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Đang tải...</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item, index) => `post-${item.id}-${index}`}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContainer}
      removeClippedSubviews={false}
    />
  );
};

const styles = StyleSheet.create({
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  activeStatText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
