import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle, FlatList } from 'react-native';
import { ArrowLeft, Users, Grid2x2 as Grid, Mail, Phone, MapPin, Calendar, LogOut, Share2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { userAPI, User, postAPI, PostResponse, shareAPI } from '../services/api';
import FollowingList from '../components/FollowingList';
import { FollowersList } from '../components/FollowersList';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import { usePostContext } from '../contexts/PostContext';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { logout, user: currentUser } = useAuth();
  const { updatePost, updatePostLike, updatePostShare, initializePosts } = usePostContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'shared' | 'friends'>('posts');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sharedPosts, setSharedPosts] = useState<PostResponse[]>([]);
  const [sharedPostsLoading, setSharedPostsLoading] = useState(false);


  useEffect(() => {
    if (userId) {
      // Handle case where userId might be an array
      const actualUserId = Array.isArray(userId) ? userId[0] : userId;
      fetchUserProfile(actualUserId);
    } else if (currentUser) {
      // If no userId provided, show current user's profile
      fetchUserProfile(currentUser.id.toString());
    } else {
      setLoading(false);
    }
  }, [userId, currentUser]);

  // Refresh profile data when screen comes back into focus (e.g., returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        const actualUserId = Array.isArray(userId) ? userId[0] : userId;
        fetchUserProfile(actualUserId);
      } else if (currentUser) {
        fetchUserProfile(currentUser.id.toString());
      }
    }, [userId, currentUser])
  );

  // Debug activeTab changes
  useEffect(() => {
    // Load shared posts when switching to shared tab
    if (activeTab === 'shared' && user && sharedPosts.length === 0) {
      loadSharedPosts(user.id);
    }
  }, [activeTab, user]);


  const fetchUserProfile = async (targetUserId?: string) => {
    const userIdToFetch = targetUserId || userId;
    try {
      setLoading(true);
      console.log(`🚀 [UserProfile] API CALL: Getting user ${userIdToFetch}`);
      console.log(`🚀 [UserProfile] API URL: /User/${userIdToFetch}`);
      const userData = await userAPI.getUserById(parseInt(userIdToFetch));
      console.log(`✅ [UserProfile] API SUCCESS: Received user data:`, userData);
      console.log(`✅ [UserProfile] User name: ${userData.fullName}, Email: ${userData.email}`);
      setUser(userData);
      
      // Load user posts after getting user data
      await loadUserPosts(parseInt(userIdToFetch));
    } catch (error: any) {
      console.error('❌ [UserProfile] API ERROR:', error);
      console.error('[UserProfile] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (userId: number) => {
    try {
      setPostsLoading(true);
      console.log(`🚀 [UserProfile] Loading posts for user ${userId}`);
      const postsData = await postAPI.getPostsByUser(userId);
      console.log(`✅ [UserProfile] Posts loaded:`, postsData);
      initializePosts(postsData);
      setPosts(postsData);
    } catch (error: any) {
      console.error('❌ [UserProfile] Posts loading error:', error);
      // Don't show alert for posts loading error, just log it
    } finally {
      setPostsLoading(false);
    }
  };

  const loadSharedPosts = async (userId: number) => {
    try {
      setSharedPostsLoading(true);
      console.log(`🚀 [UserProfile] Loading shared posts for user ${userId}`);
      const sharedPostsData = await postAPI.getSharedPostsByUser(userId);
      console.log(`✅ [UserProfile] Shared posts loaded:`, sharedPostsData);
      setSharedPosts(sharedPostsData);
    } catch (error: any) {
      console.error('❌ [UserProfile] Shared posts loading error:', error);
    } finally {
      setSharedPostsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handlePostUpdated = (updatedPost: PostResponse) => {
    console.log(`🔄 [Profile] Post updated:`, updatedPost);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    updatePost(updatedPost.id, updatedPost);
  };

  const handlePostDeleted = (postId: number) => {
    console.log(`🗑️ [Profile] Post deleted:`, postId);
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    // Update PostContext to mark post as deleted
    updatePost(postId, { isDeleted: true });
  };

  const handlePostLikeToggle = (postId: number, isLiked: boolean) => {
    console.log(`❤️ [Profile] Post ${postId} like toggled:`, isLiked);
    // PostCard already calls updatePostLike, so we only update local state
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
    console.log(`🔄 [Profile] Post ${postId} share toggled:`, isShared);
    // PostCard already calls updatePostShare, so we only update local state
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

  const handleUnsharePost = async (postId: number) => {
    if (!user || !currentUser) return;

    Alert.alert(
      'Bỏ chia sẻ',
      'Bạn có chắc chắn muốn bỏ chia sẻ bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ chia sẻ',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [Profile] Unsharing post ${postId} for user ${currentUser.id}`);
              await shareAPI.unsharePost(currentUser.id, postId);
              
              // Remove from shared posts list
              setSharedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              
              // Update share count in original posts list
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === postId 
                    ? { 
                        ...post, 
                        isShared: false,
                        shareCount: Math.max(0, post.shareCount - 1)
                      }
                    : post
                )
              );
              
              // Update global context
              updatePostShare(postId, false);
              
              console.log(`✅ [Profile] Successfully unshared post ${postId}`);
            } catch (error: any) {
              console.error('❌ [Profile] Error unsharing post:', error);
              Alert.alert('Lỗi', 'Không thể bỏ chia sẻ bài viết');
            }
          }
        }
      ]
    );
  };

  const handleCommentCountUpdate = (postId: number, commentCount: number) => {
    console.log(`💬 [Profile] Post ${postId} comment count updated:`, commentCount);
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

  const renderSharedPostItem = ({ item }: { item: PostResponse }) => (
    <View style={styles.sharedPostContainer}>
      <PostCard
        postData={item}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        onLikeToggle={handlePostLikeToggle}
        onShareToggle={handlePostShareToggle}
        onCommentCountUpdate={handleCommentCountUpdate}
        showImage={true}
      />
      {currentUser && user && currentUser.id === user.id && (
        <TouchableOpacity 
          style={styles.unshareButton}
          onPress={() => handleUnsharePost(item.id)}
          activeOpacity={0.7}
        >
          <Share2 size={16} color={COLORS.accent.danger} />
          <Text style={styles.unshareButtonText}>Bỏ chia sẻ</Text>
        </TouchableOpacity>
      )}
    </View>
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
        {currentUser && user && currentUser.id === user.id ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </View>

          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.bio}>
            {user.bio || 'Chưa có tiểu sử'}
          </Text>

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>

          {user.phoneNumber && (
            <View style={styles.infoRow}>
              <Phone size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{user.phoneNumber}</Text>
            </View>
          )}

          {user.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>
              Tham gia {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </Text>
          </View>

          <View style={styles.stats}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('👆 [Profile] Posts stat pressed');
                setActiveTab('posts');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{user.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('👆 [Profile] Followers stat pressed');
                console.log('👆 [Profile] Navigating to followers screen');
                router.push(`/followers?id=${user.id}` as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('👆 [Profile] Following stat pressed');
                console.log('👆 [Profile] Navigating to following screen');
                router.push(`/following?id=${user.id}` as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{user.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => {
              console.log('👆 [Profile] Posts tab pressed');
              setActiveTab('posts');
            }}
            activeOpacity={0.7}
          >
            <Grid size={20} color={activeTab === 'posts' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Bài viết
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
            onPress={() => {
              console.log('👆 [Profile] Shared tab pressed');
              setActiveTab('shared');
            }}
            activeOpacity={0.7}
          >
            <Share2 size={20} color={activeTab === 'shared' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>
              Đã chia sẻ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => {
              console.log('👆 [Profile] Friends tab pressed');
              setActiveTab('friends');
            }}
            activeOpacity={0.7}
          >
            <Users size={20} color={activeTab === 'friends' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Bạn bè
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <View style={styles.postsContainer}>
            {postsLoading ? (
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
              <View style={styles.emptyPostsContainer}>
                <Grid size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                {currentUser && user && currentUser.id === user.id && (
                  <TouchableOpacity 
                    style={styles.createPostButton}
                    onPress={() => router.push('/(tabs)/create' as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createPostButtonText}>Tạo bài viết đầu tiên</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : activeTab === 'shared' ? (
          <View style={styles.postsContainer}>
            {sharedPostsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải bài viết đã chia sẻ...</Text>
              </View>
            ) : sharedPosts.length > 0 ? (
              <FlatList
                data={sharedPosts}
                renderItem={renderSharedPostItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.postsList}
                style={styles.postsFlatList}
              />
            ) : (
              <View style={styles.emptyPostsContainer}>
                <Share2 size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>Chưa chia sẻ bài viết nào</Text>
                <Text style={styles.emptySubText}>
                  Hãy chia sẻ bài viết từ trang chủ!
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.friendsContainer}>
            <Users size={48} color={COLORS.gray} />
            <Text style={styles.friendsTitle}>Bạn bè</Text>
            <Text style={styles.friendsSubtitle}>
              {user.followersCount || 0} người theo dõi • {user.followingCount || 0} đang theo dõi
            </Text>
            <Text style={styles.friendsHint}>
              Nhấn vào số lượng ở trên để xem chi tiết
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  } as TextStyle,
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.error,
  } as TextStyle,
  profileInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  avatarContainer: {
    alignItems: 'center',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 4,
    borderColor: COLORS.white,
  } as ImageStyle,
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  } as TextStyle,
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  } as ViewStyle,
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  } as TextStyle,
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  } as TextStyle,
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.primary,
  } as ViewStyle,
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
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
  } as ViewStyle,
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  } as ViewStyle,
  tabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  } as TextStyle,
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  } as TextStyle,
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  } as TextStyle,
  emptySubText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  } as TextStyle,
  sharedPostContainer: {
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  unshareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginTop: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  unshareButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.accent.danger,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  postsContainer: {
    flex: 1,
  } as ViewStyle,
  postsFlatList: {
    flex: 1,
  } as ViewStyle,
  postsList: {
    paddingBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  emptyPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  createPostButton: {
    marginTop: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  createPostButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.white,
    fontWeight: '600',
  } as TextStyle,
  friendsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xl,
    minHeight: 200,
  } as ViewStyle,
  friendsTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  friendsSubtitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as TextStyle,
  friendsHint: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,
});