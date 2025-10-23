import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { UserSearchCard } from './UserSearchCard';
import { userAPI, User } from '@/services/api';
import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';

interface SuggestedUsersProps {
  limit?: number;
  onUserPress?: (userId: number) => void;
}

export const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ 
  limit = 10,
  onUserPress 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSuggestedUsers = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log(`[SuggestedUsers] Fetching suggested users, limit: ${limit}`);
      
      const suggestedUsers = await userAPI.getSuggestedUsers(limit) as any;
      
      console.log(`[SuggestedUsers] Suggested users result:`, suggestedUsers);
      
      setUsers(suggestedUsers);
      
    } catch (err: any) {
      console.error('[SuggestedUsers] Fetch error:', err);
      
      let errorMessage = 'Không thể tải danh sách gợi ý';
      
      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Không có người dùng gợi ý';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSuggestedUsers(true);
  };

  const handleUserPress = (userId: number) => {
    if (onUserPress) {
      onUserPress(userId);
    } else {
      // Default behavior: navigate to user profile
      router.push(`/profile?userId=${userId}`);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, [limit]);

  const renderUser = ({ item }: { item: User }) => (
    <UserSearchCard
      user={item}
      onUserPress={handleUserPress}
      showFollowButton={true}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Lỗi tải dữ liệu</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Không có gợi ý</Text>
        <Text style={styles.emptyText}>
          Hiện tại không có người dùng nào để gợi ý
        </Text>
      </View>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải gợi ý...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Gợi ý kết bạn</Text>
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        ListEmptyComponent={renderEmpty}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    gap: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
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
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.xl,
  },
  emptyTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
