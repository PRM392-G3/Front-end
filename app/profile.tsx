import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Users, Grid2x2 as Grid, Mail, Phone, MapPin, Calendar } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useGlobalSearchParams } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { userAPI, User } from '../services/api';
import FollowingList from '../components/FollowingList';
import { FollowersList } from '../components/FollowersList';

export default function UserProfileScreen() {
  const globalParams = useGlobalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'following'>('posts');

  // Get userId from global params
  const userId = globalParams.userId;

  // Debug: Log the userId parameter
  console.log(`🚀 [UserProfile] Received userId from global params:`, userId);
  console.log(`🚀 [UserProfile] userId type:`, typeof userId);
  console.log(`🚀 [UserProfile] All global search params:`, globalParams);

  useEffect(() => {
    console.log(`🚀 [UserProfile] useEffect triggered with userId:`, userId);
    
    if (userId) {
      // Handle case where userId might be an array
      const actualUserId = Array.isArray(userId) ? userId[0] : userId;
      console.log(`🚀 [UserProfile] Actual userId to use:`, actualUserId);
      fetchUserProfile(actualUserId);
    } else {
      console.warn(`❌ [UserProfile] No userId provided in params`);
      setLoading(false);
    }
  }, [userId]);

  // Debug activeTab changes
  useEffect(() => {
    console.log(`🔄 [Profile] Active tab changed to:`, activeTab);
  }, [activeTab]);

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

  const handleGoBack = () => {
    router.back();
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
        <View style={styles.placeholder} />
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('👆 [Profile] Following stat pressed');
                console.log('👆 [Profile] Setting activeTab to following');
                setActiveTab('following');
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
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => {
              console.log('👆 [Profile] Following tab pressed');
              setActiveTab('following');
            }}
            activeOpacity={0.7}
          >
            <Users size={20} color={activeTab === 'following' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              Đang theo dõi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <View style={styles.postsContainer}>
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          </View>
        ) : (
          <FollowingList userId={user.id} isOwnProfile={true} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.error,
  },
  profileInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
    gap: RESPONSIVE_SPACING.xs,
  },
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  },
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: RESPONSIVE_SPACING.sm,
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
  postsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.xl,
    minHeight: 200,
  },
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
