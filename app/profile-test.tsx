import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Users, Grid2x2 as Grid, Mail, Phone, MapPin, Calendar } from 'lucide-react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { userAPI, User, postAPI, PostResponse } from '../services/api';
import FollowingList from '../components/FollowingList';
import { FollowersList } from '../components/FollowersList';
import PostCard from '../components/PostCard';

export default function OtherUserProfileScreen() {
  const globalParams = useGlobalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'following'>('posts');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Get userId from global params
  const userId = globalParams.userId;

  useEffect(() => {
    if (userId) {
      const actualUserId = Array.isArray(userId) ? userId[0] : userId;
      fetchUserProfile(actualUserId);
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserProfile = async (targetUserId?: string) => {
    const userIdToFetch = targetUserId || userId;
    try {
      setLoading(true);
      const userData = await userAPI.getUserById(parseInt(userIdToFetch));
      setUser(userData);
      
      // Load user posts to get accurate count
      await loadUserPosts(parseInt(userIdToFetch));
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (userId: number) => {
    try {
      setPostsLoading(true);
      console.log(`🚀 [ProfileTest] Loading posts for user ${userId}`);
      const postsData = await postAPI.getPostsByUser(userId);
      console.log(`✅ [ProfileTest] Posts loaded:`, postsData);
      console.log(`📊 [ProfileTest] Posts count: ${postsData.length}`);
      setPosts(postsData);
    } catch (error: any) {
      console.error('❌ [ProfileTest] Posts loading error:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      const currentUserId = 7; // Temporary hardcoded for testing
      await userAPI.followUser(currentUserId, user.id);
      
      // Refresh user data to update follow status
      fetchUserProfile();
      Alert.alert('Thành công', `Đã theo dõi ${user.fullName}`);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể theo dõi người dùng này');
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    
    try {
      const currentUserId = 7; // Temporary hardcoded for testing
      await userAPI.unfollowUser(currentUserId, user.id);
      
      // Refresh user data to update follow status
      fetchUserProfile();
      Alert.alert('Thành công', `Đã bỏ theo dõi ${user.fullName}`);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể bỏ theo dõi người dùng này');
    }
  };

  const handlePostUpdated = (updatedPost: PostResponse) => {
    console.log(`🔄 [ProfileTest] Post updated:`, updatedPost);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (postId: number) => {
    console.log(`🗑️ [ProfileTest] Post deleted:`, postId);
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const handlePostLikeToggle = (postId: number, isLiked: boolean) => {
    console.log(`❤️ [ProfileTest] Post ${postId} like toggled:`, isLiked);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked, 
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1 
            }
          : post
      )
    );
  };

  const handlePostShareToggle = (postId: number, isShared: boolean) => {
    console.log(`🔄 [ProfileTest] Post ${postId} share toggled:`, isShared);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isShared, 
              shareCount: isShared ? post.shareCount + 1 : post.shareCount - 1 
            }
          : post
      )
    );
  };

  const handleCommentCountUpdate = (postId: number, commentCount: number) => {
    console.log(`💬 [ProfileTest] Post ${postId} comment count updated:`, commentCount);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, commentCount } : post
      )
    );
  };

  const renderPostItem = ({ item }: { item: PostResponse }) => (
    <PostCard
      postData={item}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
      onLikeToggle={handlePostLikeToggle}
      onShareToggle={handlePostShareToggle}
      onCommentCountUpdate={handleCommentCountUpdate}
      showImage={true}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
          <Text style={styles.errorSubtext}>UserId: {userId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.fullName}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        data={activeTab === 'posts' ? [] : []}
        keyExtractor={() => 'profile'}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              {/* Cover Image */}
              <View style={styles.coverImageContainer}>
                <Image 
                  source={{ uri: user.coverImageUrl || 'https://via.placeholder.com/400x200/4A90E2/FFFFFF?text=Cover+Image' }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={{ uri: user.avatarUrl || 'https://via.placeholder.com/120x120/4A90E2/FFFFFF?text=Avatar' }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.fullName}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  
                  {/* Follow Button */}
                  <TouchableOpacity 
                    style={styles.followButton}
                    onPress={handleFollow}
                  >
                    <Text style={styles.followButtonText}>Theo dõi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Người theo dõi</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => setActiveTab('following')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{user.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Đang theo dõi</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => setActiveTab('posts')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Bài viết</Text>
              </TouchableOpacity>
            </View>

            {/* Contact Info */}
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Mail size={20} color={COLORS.gray} />
                <Text style={styles.contactText}>{user.email}</Text>
              </View>
              {user.phoneNumber && (
                <View style={styles.contactItem}>
                  <Phone size={20} color={COLORS.gray} />
                  <Text style={styles.contactText}>{user.phoneNumber}</Text>
                </View>
              )}
              {user.location && (
                <View style={styles.contactItem}>
                  <MapPin size={20} color={COLORS.gray} />
                  <Text style={styles.contactText}>{user.location}</Text>
                </View>
              )}
              <View style={styles.contactItem}>
                <Calendar size={20} color={COLORS.gray} />
                <Text style={styles.contactText}>
                  Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                onPress={() => setActiveTab('posts')}
                activeOpacity={0.7}
              >
                <Grid size={20} color={activeTab === 'posts' ? COLORS.primary : COLORS.gray} />
                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                  Bài viết
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                onPress={() => setActiveTab('following')}
                activeOpacity={0.7}
              >
                <Users size={20} color={activeTab === 'following' ? COLORS.primary : COLORS.gray} />
                <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                  Đang theo dõi
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        ListFooterComponent={() => (
          activeTab === 'posts' ? (
            postsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải bài viết...</Text>
              </View>
            ) : posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.postsList}
                style={styles.postsFlatList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Grid size={48} color={COLORS.gray} />
                <Text style={styles.emptyStateText}>Chưa có bài viết nào</Text>
              </View>
            )
          ) : (
            <FollowingList userId={user.id} isOwnProfile={false} />
          )
        )}
      />
    </SafeAreaView>
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
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  followingContainer: {
    flex: 1,
  },
  followingContent: {
    minHeight: 400,
  },
  profileHeader: {
    backgroundColor: COLORS.white,
  },
  coverImageContainer: {
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingBottom: RESPONSIVE_SPACING.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  userDetails: {
    alignItems: 'center',
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  userEmail: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  followButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  },
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
  contactInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  contactText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  },
  postsList: {
    paddingBottom: RESPONSIVE_SPACING.lg,
  },
  postsFlatList: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.lg,
  },
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    color: COLORS.error,
    marginBottom: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
