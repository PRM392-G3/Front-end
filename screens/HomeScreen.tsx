import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert, FlatList } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import CreatePostScreen from '@/screens/CreatePostScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, RefreshCw, Search, Bell } from 'lucide-react-native';
import { postAPI, PostResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useFocusEffect } from '@react-navigation/native';
import { PostLikesTestComponent } from '@/components/PostLikesTestComponent';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { user } = useAuth();
  const { 
    posts, 
    setPosts, 
    updatePostLike, 
    updatePostShare, 
    updatePostComment,
    updatePost, 
    getPostShareState, 
    initializePosts, 
    forceRefreshPosts,
    syncPostState,
    getSyncedPost,
    cacheTimestamp,
    savePostsToCache
  } = usePostContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPosts = useCallback(async (forceRefresh = false, pageNumber = 1) => {
    try {
      if (forceRefresh) {
        forceRefreshPosts();
        setPage(1);
        setHasMore(true);
      }
      
      console.log('🏠 [HomeScreen] Fetching posts with like status...', `Page: ${pageNumber}`);
      
      // Fetch posts with pagination
      const fetchedPosts = await postAPI.getAllPostsWithLikes(pageNumber);
      console.log('🏠 [HomeScreen] Fetched posts:', fetchedPosts.length);
      
      if (pageNumber === 1) {
        // For first page, use smart merge with cache
        initializePosts(fetchedPosts);
      } else {
        // For subsequent pages, append new posts and remove duplicates
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p.id));
          const newUniquePosts = fetchedPosts.filter((p) => !existingIds.has(p.id));
          console.log('🏠 [HomeScreen] Appending', newUniquePosts.length, 'new posts (filtered', fetchedPosts.length - newUniquePosts.length, 'duplicates)');
          return [...prevPosts, ...newUniquePosts];
        });
      }
      
      // Check if there are more posts
      // If we got fewer than pageSize posts, we've reached the end
      setHasMore(fetchedPosts.length === 10);
      setPage(pageNumber);
      
      console.log('🏠 [HomeScreen] Has more posts:', fetchedPosts.length === 10);
      
      // Prefetch next page in background with intelligent timing
      if (pageNumber === 1 && fetchedPosts.length > 0) {
        // Delay based on cache freshness to optimize bandwidth
        const cacheAge = Date.now() - cacheTimestamp;
        const prefetchDelay = cacheAge < 5 * 60 * 1000 ? 3000 : 1000; // 3s for fresh cache, 1s for stale
        
        setTimeout(async () => {
          try {
            console.log('🏠 [HomeScreen] Prefetching next page...');
            const nextPagePosts = await postAPI.getAllPostsWithLikes(2);
            console.log('🏠 [HomeScreen] Prefetched posts:', nextPagePosts.length);
            
            // Merge prefetched posts into cache
            if (nextPagePosts.length > 0) {
              savePostsToCache([...posts, ...nextPagePosts]);
            }
          } catch (error) {
            console.log('Pre-fetch error (non-critical):', error);
          }
        }, prefetchDelay);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      
      // If offline or network error, show cached data if available
      if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        console.log('🏠 [HomeScreen] Network error, using cached data');
        if (posts.length > 0) {
          console.log('🏠 [HomeScreen] Using', posts.length, 'cached posts');
          // Don't show error if we have cached data
          return;
        }
      }
      
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [posts]);

  // Auto refresh timer
  useEffect(() => {
    const startAutoRefresh = () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
      
      // Auto refresh every 30 seconds
      autoRefreshTimer.current = setInterval(async () => {
        console.log('🏠 [HomeScreen] Auto refreshing posts...');
        try {
          forceRefreshPosts();
          const fetchedPosts = await postAPI.getAllPostsWithLikes();
          initializePosts(fetchedPosts);
        } catch (error) {
          console.error('Auto refresh error:', error);
        }
      }, 30000);
    };

    startAutoRefresh();

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, []);

  // Load posts when screen focuses - PRIORITIZE CACHE
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 [HomeScreen] Screen focused, posts available:', posts.length);
      
      // If we already have posts (from cache or previous load), don't reload
      if (posts.length > 0 && initialLoadComplete) {
        console.log('🏠 [HomeScreen] Already have posts, skipping reload');
        return;
      }
      
      const loadPosts = async () => {
        try {
          // Only show loading if we don't have ANY posts
          if (posts.length === 0) {
            setIsLoading(true);
          }
          
          const fetchedPosts = await postAPI.getAllPostsWithLikes(1);
          initializePosts(fetchedPosts);
          setInitialLoadComplete(true);
        } catch (error) {
          console.error('Error fetching posts:', error);
          // Keep showing cached posts if available
          if (posts.length > 0) {
            console.log('🏠 [HomeScreen] Network error, keeping cached posts');
          } else {
            Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng kiểm tra kết nối mạng.');
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      // If no posts, fetch from server, otherwise skip
      if (posts.length === 0) {
        loadPosts();
      } else {
        console.log('🏠 [HomeScreen] Using cached posts, skipping network request');
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    }, [posts.length, initialLoadComplete])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchPosts(true, 1);
      setInitialLoadComplete(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPosts]);
  
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && page > 0) {
      console.log('🏠 [HomeScreen] Loading more posts...');
      setIsLoadingMore(true);
      fetchPosts(false, page + 1);
    }
  }, [isLoadingMore, hasMore, page, fetchPosts]);

  const handlePostLike = useCallback((postId: number, isLiked: boolean) => {
    // PostCard already calls updatePostLike, so we don't need to call it again
  }, []);

  const handlePostShare = useCallback((postId: number, isShared: boolean) => {
    // PostCard already calls updatePostShare, so we don't need to call it again
  }, []);

  const handlePostUpdated = useCallback((updatedPost: PostResponse) => {
    updatePost(updatedPost.id, updatedPost);
  }, [updatePost]);

  const handlePostDeleted = useCallback((postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
  }, [posts, setPosts]);

  const handleCommentCountUpdate = useCallback((postId: number, commentCount: number) => {
    updatePostComment(postId, commentCount);
    updatePost(postId, { commentCount });
  }, [updatePost, updatePostComment]);

  const renderPost = useCallback(({ item }: { item: PostResponse }) => (
    <PostCard
      postData={item}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
      onLikeToggle={handlePostLike}
      onShareToggle={handlePostShare}
      onCommentCountUpdate={handleCommentCountUpdate}
      showImage={true}
    />
  ), [handlePostUpdated, handlePostDeleted, handlePostLike, handlePostShare, handleCommentCountUpdate]);

  const renderEmptyState = () => {
    // Only show empty state if we're not loading, no posts, AND initial load is complete
    // Also, only show if NO posts exist in the database at all (not just end of current page)
    if (isLoading || posts.length > 0 || !initialLoadComplete) return null;
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Chưa có bài viết nào</Text>
        <Text style={styles.emptyStateSubtitle}>
          Hãy tạo bài viết đầu tiên của bạn!
        </Text>
        <TouchableOpacity
          style={styles.createFirstPostButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Text style={styles.createFirstPostButtonText}>Tạo bài viết</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + RESPONSIVE_SPACING.sm }]}>
      <Text style={styles.headerTitle}>Trang chủ</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Plus size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showCreatePost) {
    return (
      <CreatePostScreen
        onClose={() => setShowCreatePost(false)}
        onPostCreated={(newPost) => {
          // Add new post to the beginning of the list
          setPosts([newPost, ...posts]);
          setShowCreatePost(false);
          // Force refresh to get latest data from server
          setTimeout(async () => {
            try {
              forceRefreshPosts();
              const fetchedPosts = await postAPI.getAllPostsWithLikes();
              initializePosts(fetchedPosts);
            } catch (error) {
              console.error('Error refreshing after post creation:', error);
            }
          }, 1000);
        }}
      />
    );
  }

  // Don't show loading if we have cached posts
  const showLoading = isLoading && posts.length === 0;

  if (showLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
      {renderHeader()}
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.accent.primary]}
            tintColor={COLORS.accent.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
            </View>
          ) : !hasMore && posts.length > 0 ? (
            <View style={styles.endOfList}>
              <Text style={styles.endOfListText}>Đã đến cuối danh sách</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={initialLoadComplete && posts.length === 0 ? renderEmptyState : null}
        ListHeaderComponent={
          posts.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.postsCount}>
                {posts.length} bài viết
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsList: {
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingBottom: RESPONSIVE_SPACING.lg,
  },
  listHeader: {
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.secondary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  postsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
    lineHeight: 22,
  },
  createFirstPostButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  createFirstPostButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  loadingMore: {
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  endOfList: {
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
});