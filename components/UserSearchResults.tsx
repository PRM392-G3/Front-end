import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES } from '@/constants/theme';
import { UserSearchCard } from './UserSearchCard';
import { userAPI, User } from '@/services/api';
import { useRouter } from 'expo-router';

interface UserSearchResultsProps {
  searchQuery: string;
  onUserPress?: (userId: number) => void;
}

export const UserSearchResults: React.FC<UserSearchResultsProps> = ({ 
  searchQuery, 
  onUserPress 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const searchUsers = async (query: string, page: number = 1, isRefresh: boolean = false) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log(`[UserSearchResults] Searching users: "${query}"`);
      
      const result = await userAPI.searchUsers(query, page, 20) as any;
      
      console.log(`[UserSearchResults] Search result:`, result);
      console.log(`[UserSearchResults] Is Array?`, Array.isArray(result));
      console.log(`[UserSearchResults] Result type:`, typeof result);
      
      // Backend có thể trả về:
      // 1. Array của users: [{...}, {...}]
      // 2. Single user object: {...}
      // 3. Object có property users: {users: [...]}
      if (Array.isArray(result)) {
        console.log(`[UserSearchResults] Setting users from array, count:`, result.length);
        setUsers(result as User[]);
        setHasMore(false);
      } else if (result && result.id) {
        // Single user object - wrap trong array
        console.log(`[UserSearchResults] Single user object, wrapping in array`);
        setUsers([result] as User[]);
        setHasMore(false);
      } else if (result && result.users) {
        // Object có property users
        console.log(`[UserSearchResults] Setting users from result.users`);
        setUsers((result.users || []) as User[]);
        setHasMore(false);
      } else {
        console.log(`[UserSearchResults] Unknown format, setting empty array`);
        setUsers([]);
        setHasMore(false);
      }
      
    } catch (err: any) {
      console.error('[UserSearchResults] Search error:', err);
      console.error('[UserSearchResults] Error response:', err.response?.data);
      console.error('[UserSearchResults] Error status:', err.response?.status);
      
      let errorMessage = 'Không thể tìm kiếm người dùng';
      
      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 400) {
        // Handle 400 Bad Request - might be empty query or invalid parameters
        const errorData = err.response?.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = 'Truy vấn tìm kiếm không hợp lệ';
        }
        setUsers([]); // Set empty array for 400
      } else if (err.response?.status === 404) {
        errorMessage = 'Không tìm thấy kết quả nào';
        setUsers([]); // Set empty array for 404
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
    searchUsers(searchQuery, 1, true);
  };

  const handleLoadMore = () => {
    // Backend không có pagination nên không cần load more
    // Giữ function này để tránh lỗi nhưng không làm gì
    return;
  };

  const handleUserPress = (userId: number) => {
    if (onUserPress) {
      onUserPress(userId);
    } else {
      // Default behavior: navigate to user profile
      router.push({
        pathname: '/profile',
        params: { userId: userId.toString() }
      } as any);
    }
  };

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
          <Text style={styles.emptyTitle}>Lỗi tìm kiếm</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }
    
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptyText}>
            Không có người dùng nào phù hợp với "{searchQuery}"
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Tìm kiếm người dùng</Text>
        <Text style={styles.emptyText}>
          Nhập tên hoặc email để tìm kiếm người dùng
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || users.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
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
  listContent: {
    padding: RESPONSIVE_SPACING.sm,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
