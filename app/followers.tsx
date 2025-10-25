import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle, Image } from 'react-native';
import { ArrowLeft, Users } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';
import { userAPI, User } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user info
      const userData = await userAPI.getUserById(parseInt(id));
      setUser(userData);
      
      // Load followers list with follow status
      const followersData = await userAPI.getFollowersWithStatus(parseInt(id));
      console.log('✅ [Followers] API SUCCESS: Received followers data:', followersData);
      
      // Handle different response formats
      const followersList = Array.isArray(followersData) ? followersData : (followersData as any)?.data || (followersData as any)?.followers || [];
      setFollowers(followersList);
    } catch (error: any) {
      console.error('❌ [Followers] API ERROR:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người theo dõi');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleUserPress = (userId: number) => {
    router.push({
      pathname: '/profile',
      params: { userId: userId.toString() }
    } as any);
  };

  const handleFollow = async (followerId: number) => {
    if (!currentUser) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để theo dõi');
      return;
    }

    try {
      await userAPI.followUser(currentUser.id, followerId);
      // Update following status in the followers list
      setFollowers(prev => prev.map(follower => 
        follower.id === followerId 
          ? { ...follower, isFollowing: true }
          : follower
      ));
      Alert.alert('Thành công', 'Đã theo dõi người dùng');
    } catch (error: any) {
      console.error('❌ [Followers] Follow error:', error);
      Alert.alert('Lỗi', 'Không thể theo dõi người dùng này');
    }
  };

  const handleUnfollow = async (followerId: number) => {
    if (!currentUser) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để bỏ theo dõi');
      return;
    }

    try {
      await userAPI.unfollowUser(currentUser.id, followerId);
      // Update following status in the followers list
      setFollowers(prev => prev.map(follower => 
        follower.id === followerId 
          ? { ...follower, isFollowing: false }
          : follower
      ));
      Alert.alert('Thành công', 'Đã bỏ theo dõi người dùng');
    } catch (error: any) {
      console.error('❌ [Followers] Unfollow error:', error);
      Alert.alert('Lỗi', 'Không thể bỏ theo dõi người dùng này');
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Người theo dõi {user?.fullName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
      >
        {/* Followers Count */}
        <View style={styles.countContainer}>
          <Users size={24} color={COLORS.primary} />
          <Text style={styles.countText}>
            {followers.length} người theo dõi
          </Text>
        </View>

        {/* Followers List */}
        {followers.length > 0 ? (
          <View style={styles.listContainer}>
            {followers.map((follower) => (
              <TouchableOpacity
                key={follower.id}
                style={styles.userItem}
                onPress={() => handleUserPress(follower.id)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  {follower.avatarUrl ? (
                    <Image source={{ uri: follower.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {follower.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{follower.fullName}</Text>
                  <Text style={styles.userEmail}>{follower.email}</Text>
                  {follower.bio && (
                    <Text style={styles.userBio}>{follower.bio}</Text>
                  )}
                  {/* Show follow status if viewing own followers list */}
                  {currentUser && user && currentUser.id === user.id && (
                    <Text style={styles.followStatus}>
                      {follower.isFollowing ? 'Đang theo dõi' : 'Chưa theo dõi'}
                    </Text>
                  )}
                </View>
                {/* Only show follow button if viewing own followers list and not following this user */}
                {currentUser && user && currentUser.id === user.id && currentUser.id !== follower.id && !follower.isFollowing && (
                  <TouchableOpacity
                    style={styles.followButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        'Theo dõi',
                        `Bạn có chắc chắn muốn theo dõi ${follower.fullName}?`,
                        [
                          { text: 'Hủy', style: 'cancel' },
                          { 
                            text: 'Theo dõi', 
                            onPress: () => handleFollow(follower.id)
                          }
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.followButtonText}>Theo dõi</Text>
                  </TouchableOpacity>
                )}
                {/* Show unfollow button if viewing own followers list and already following this user */}
                {currentUser && user && currentUser.id === user.id && currentUser.id !== follower.id && follower.isFollowing && (
                  <TouchableOpacity
                    style={styles.unfollowButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        'Bỏ theo dõi',
                        `Bạn có chắc chắn muốn bỏ theo dõi ${follower.fullName}?`,
                        [
                          { text: 'Hủy', style: 'cancel' },
                          { 
                            text: 'Bỏ theo dõi', 
                            style: 'destructive',
                            onPress: () => handleUnfollow(follower.id)
                          }
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.unfollowButtonText}>Bỏ theo dõi</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>Chưa có người theo dõi nào</Text>
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
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
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  } as TextStyle,
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  countText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  listContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  } as ViewStyle,
  avatarContainer: {
    marginRight: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  } as ImageStyle,
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  } as TextStyle,
  userInfo: {
    flex: 1,
  } as ViewStyle,
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  } as TextStyle,
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  userBio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  } as TextStyle,
  followStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  followButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.white,
  } as TextStyle,
  unfollowButton: {
    backgroundColor: COLORS.accent.danger,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  unfollowButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.white,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.md,
  } as TextStyle,
});
