import React, { useState, useEffect, useCallback } from 'react';
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
  const { user } = useAuth();
  const { posts, setPosts, updatePostLike, updatePostShare, updatePost, getPostShareState, initializePosts } = usePostContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const fetchedPosts = await postAPI.getAllPosts();
      initializePosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [initializePosts]);

  // Load posts when screen focuses (only useFocusEffect, remove useEffect to prevent duplicate calls)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchPosts();
      }
    }, [user, fetchPosts])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

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
    updatePost(postId, { commentCount });
  }, [updatePost]);

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

  const renderEmptyState = () => (
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
          setPosts([newPost, ...posts]);
          setShowCreatePost(false);
        }}
      />
    );
  }

  if (isLoading) {
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
        ListEmptyComponent={renderEmptyState}
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
});