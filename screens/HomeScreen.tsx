import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import CreatePostScreen from '@/screens/CreatePostScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, RefreshCw } from 'lucide-react-native';
import { postAPI, PostResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { user } = useAuth();
  const { posts, setPosts, updatePostLike } = usePostContext();
  const insets = useSafeAreaInsets();

  const fetchPosts = useCallback(async () => {
    try {
      console.log('HomeScreen: Fetching posts...');
      const fetchedPosts = await postAPI.getAllPosts();
      console.log('HomeScreen: Posts fetched successfully:', fetchedPosts.length);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('HomeScreen: Error fetching posts:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = useCallback((newPost: PostResponse) => {
    console.log('HomeScreen: New post created:', newPost);
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setShowCreatePost(false);
  }, []);

  const handlePostDeleted = useCallback((postId: number) => {
    console.log('HomeScreen: Post deleted:', postId);
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  const handleLikeToggle = useCallback((postId: number, isLiked: boolean) => {
    console.log('HomeScreen: Like toggled:', postId, isLiked);
    updatePostLike(postId, isLiked);
  }, [updatePostLike]);

  // Fetch posts when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  if (showCreatePost) {
    return (
      <CreatePostScreen
        navigation={{ goBack: () => setShowCreatePost(false) }}
        onPostCreated={handlePostCreated}
      />
    );
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {/* Content Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        contentInsetAdjustmentBehavior="automatic"
        bounces={true}
        alwaysBounceVertical={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.storiesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TouchableOpacity key={item} style={styles.storyItem}>
                <View style={styles.storyAvatar} />
                <Text style={styles.storyText}>Story {item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.postsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài viết mới nhất</Text>
            <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
              <RefreshCw 
                size={16} 
                color={COLORS.gray} 
                style={isRefreshing ? styles.refreshingIcon : undefined}
              />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải bài viết...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowCreatePost(true)}
              >
                <Text style={styles.emptyButtonText}>Tạo bài viết đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postData={post}
                onPostDeleted={handlePostDeleted}
                onLikeToggle={handleLikeToggle}
                showImage={!!post.imageUrl || !!post.videoUrl}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: RESPONSIVE_SPACING.xl,
  },
  storiesSection: {
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  storiesScroll: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
    width: DIMENSIONS.isLargeDevice ? 80 : 70,
  },
  storyAvatar: {
    width: DIMENSIONS.isLargeDevice ? 70 : 60,
    height: DIMENSIONS.isLargeDevice ? 70 : 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginBottom: RESPONSIVE_SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  storyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  loadingContainer: {
    paddingVertical: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  emptyContainer: {
    paddingVertical: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
});
