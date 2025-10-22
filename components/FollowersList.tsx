import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { User } from '../services/api';
import { userAPI } from '../services/api';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { UserSearchCard } from './UserSearchCard';
import { useRouter } from 'expo-router';

interface FollowersListProps {
  userId: number;
}

export const FollowersList: React.FC<FollowersListProps> = ({ userId }) => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUserPress = (userId: number) => {
    console.log(`👤 [FollowersList] User pressed: ${userId}`);
    console.log(`👤 [FollowersList] About to navigate to /profile-test?userId=${userId}`);
    router.push(`/profile-test?userId=${userId}`);
    console.log(`✅ [FollowersList] Navigation command sent`);
  };

  const fetchFollowersList = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`👤 [FollowersList] Fetching followers list for user ${userId}`);

      if (!userId || userId === 0) {
        console.error(`👤 [FollowersList] Invalid userId: ${userId}`);
        setError('ID người dùng không hợp lệ');
        return;
      }

      const data = await userAPI.getFollowersList(userId);
      console.log(`👤 [FollowersList] Received data:`, data);
      setFollowers(data);
    } catch (err: any) {
      console.error('[FollowersList] Error fetching followers list:', err);
      console.error('[FollowersList] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });

      let errorMessage = 'Không thể tải danh sách người theo dõi';

      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Không tìm thấy người dùng hoặc API endpoint không tồn tại.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      }

      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFollowersList();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFollowersList();
  }, [userId]);

  const renderUser = ({ item }: { item: User }) => (
    <UserSearchCard 
      user={item} 
      showFollowButton={true} // Có nút follow để follow lại
      onUserPress={handleUserPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có người theo dõi nào</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && followers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Vui lòng thử lại sau</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: RESPONSIVE_SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.xl,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.lg,
  },
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  errorSubtext: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
