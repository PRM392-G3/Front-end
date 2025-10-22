import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
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

      console.log(`[UserSearchResults] Searching users: "${query}", page: ${page}`);
      
      const result = await userAPI.searchUsers(query, page, 20);
      
      console.log(`[UserSearchResults] Search result:`, result);
      
      if (page === 1) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }
      
      setHasMore(result.currentPage < result.totalPages);
      setCurrentPage(result.currentPage);
      
    } catch (err: any) {
      console.error('[UserSearchResults] Search error:', err);
      
      let errorMessage = 'Không thể tìm kiếm người dùng';
      
      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Không tìm thấy kết quả nào';
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
    setCurrentPage(1);
    searchUsers(searchQuery, 1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchUsers(searchQuery, currentPage + 1);
    }
  };

  const handleUserPress = (userId: number) => {
    if (onUserPress) {
      onUserPress(userId);
    } else {
      // Default behavior: navigate to user profile
      router.push(`/profile?userId=${userId}`);
    }
  };

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      searchUsers(searchQuery, 1);
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
  },
  footerText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
