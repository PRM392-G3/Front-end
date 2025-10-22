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

  // Dữ liệu mẫu cho demo
  const mockPosts: PostResponse[] = [
    {
      id: 1,
      userId: 1,
      content: "Hôm nay thật tuyệt vời! Cảm ơn mọi người đã ủng hộ. 🌟 #nexora #happiness",
      imageUrl: "https://picsum.photos/400/300?random=1",
      likeCount: 24,
      commentCount: 8,
      shareCount: 3,
      isPublic: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 1,
        email: "user1@example.com",
        fullName: "Nguyễn Văn A",
        avatarUrl: "https://picsum.photos/100/100?random=1",
        coverImageUrl: "https://picsum.photos/800/400?random=cover1",
        phoneNumber: "0123456789",
        bio: "Lập trình viên yêu thích công nghệ",
        dateOfBirth: "1990-01-01",
        location: "Hà Nội",
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 150,
        followingCount: 200,
        postsCount: 25,
        isFollowing: false
      },
      comments: [],
      likes: [],
      tags: [
        { id: 1, name: "nexora", description: "Nexora platform", usageCount: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, name: "happiness", description: "Happy moments", usageCount: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      isLiked: false
    },
    {
      id: 2,
      userId: 2,
      content: "Chia sẻ một số suy nghĩ về cuộc sống và công việc. Hy vọng mọi người sẽ thích! 💭",
      likeCount: 15,
      commentCount: 5,
      shareCount: 2,
      isPublic: true,
      isDeleted: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      user: {
        id: 2,
        email: "user2@example.com",
        fullName: "Trần Thị B",
        avatarUrl: "https://picsum.photos/100/100?random=2",
        coverImageUrl: "https://picsum.photos/800/400?random=cover2",
        phoneNumber: "0987654321",
        bio: "Designer sáng tạo",
        dateOfBirth: "1992-05-15",
        location: "TP.HCM",
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 300,
        followingCount: 150,
        postsCount: 45,
        isFollowing: false
      },
      comments: [],
      likes: [],
      tags: [],
      isLiked: true
    },
    {
      id: 3,
      userId: 3,
      content: "Bữa tối ngon tuyệt! 🍽️ #food #delicious",
      imageUrl: "https://picsum.photos/400/300?random=3",
      likeCount: 42,
      commentCount: 12,
      shareCount: 8,
      isPublic: true,
      isDeleted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      user: {
        id: 3,
        email: "user3@example.com",
        fullName: "Lê Văn C",
        avatarUrl: "https://picsum.photos/100/100?random=3",
        coverImageUrl: "https://picsum.photos/800/400?random=cover3",
        phoneNumber: "0369852147",
        bio: "Food blogger",
        dateOfBirth: "1988-12-20",
        location: "Đà Nẵng",
        isActive: true,
        emailVerifiedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 500,
        followingCount: 300,
        postsCount: 80,
        isFollowing: false
      },
      comments: [],
      likes: [],
      tags: [
        { id: 3, name: "food", description: "Food related", usageCount: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 4, name: "delicious", description: "Delicious food", usageCount: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      isLiked: false
    }
  ];

  const fetchPosts = useCallback(async () => {
    try {
      console.log('HomeScreen: Fetching posts...');
      
      // Thử load từ API trước
      if (user) {
        try {
          const fetchedPosts = await postAPI.getAllPosts();
          console.log('HomeScreen: Posts fetched successfully, count:', fetchedPosts.length);
          
          // Validate posts before setting
          const validPosts = fetchedPosts.filter(post => post && post.id);
          
          if (validPosts.length === 0) {
            console.log('HomeScreen: No valid posts found, using mock data');
            setPosts(mockPosts);
            return;
          }
          
          setPosts(validPosts);
          return;
        } catch (apiError) {
          console.log('HomeScreen: API failed, using mock data:', apiError);
        }
      }
      
      // Nếu API fail hoặc không có user, dùng dữ liệu mẫu
      console.log('HomeScreen: Using mock posts for demo');
      setPosts(mockPosts);
    } catch (error) {
      console.error('HomeScreen: Error fetching posts:', error);
      // Fallback to mock data
      console.log('HomeScreen: Using mock posts as fallback');
      setPosts(mockPosts);
    } finally {
      setIsLoading(false);
    }
  }, [setPosts, user]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = useCallback((newPost: PostResponse) => {
    console.log('HomeScreen: New post created:', newPost);
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  }, [posts, setPosts]);

  const handlePostDeleted = useCallback((postId: number) => {
    console.log('HomeScreen: Post deleted:', postId);
    setPosts(posts.filter(post => post.id !== postId));
  }, [posts, setPosts]);

  const handleLikeToggle = useCallback((postId: number, isLiked: boolean) => {
    console.log('HomeScreen: Like toggled:', postId, isLiked);
    updatePostLike(postId, isLiked);
  }, [updatePostLike]);

  // Fetch posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Refresh posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  if (showCreatePost) {
    return (
      <CreatePostScreen
        onPostCreated={handlePostCreated}
        onClose={() => setShowCreatePost(false)}
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
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
          >
            {/* Story items would go here */}
            <View style={styles.storyItem}>
              <View style={styles.storyAvatar}>
                <Plus size={20} color={COLORS.white} />
              </View>
              <Text style={styles.storyText}>Tạo tin</Text>
            </View>
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
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  storiesContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  storyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
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