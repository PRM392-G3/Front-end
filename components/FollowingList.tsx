import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { userAPI, FollowedUser, User } from '../services/api';
import { useRouter } from 'expo-router';
import { UserMinus, Users } from 'lucide-react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { FollowersList } from './FollowersList';

interface FollowingListProps {
  userId: number; // ID của user hiện tại (follower)
  isOwnProfile?: boolean; // true nếu đang xem profile của chính mình
}

const FollowingList: React.FC<FollowingListProps> = ({ userId, isOwnProfile = true }) => {
  const [followingList, setFollowingList] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'following' | 'followers'>('following');
  const router = useRouter();

  useEffect(() => {
    fetchFollowingList();
  }, [userId]);

  const fetchFollowingList = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[FollowingList] Fetching following list for user ${userId}`);
      
      if (!userId || userId === 0) {
        console.error(`[FollowingList] Invalid userId: ${userId}`);
        setError('ID người dùng không hợp lệ');
        return;
      }
      
      const data = await userAPI.getFollowingList(userId);
      console.log(`[FollowingList] Received data:`, data);
      setFollowingList(data);
    } catch (err: any) {
      console.error('[FollowingList] Error fetching following list:', err);
      console.error('[FollowingList] Error details:', {
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

  const handleUserPress = (userId: number) => {
    // Navigate to user profile
    router.push(`/profile?userId=${userId}`);
  };

  const handleUnfollow = async (followingId: number, userName: string) => {
    Alert.alert(
      'Hủy theo dõi',
      `Bạn có chắc chắn muốn hủy theo dõi ${userName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          style: 'destructive',
          onPress: async () => {
            try {
              // userId = followerId (người đang follow)
              // followingId = người được follow
              await userAPI.unfollowUser(userId, followingId);
              Alert.alert('Thành công', `Đã hủy theo dõi ${userName}`);
              
              // Refresh the following list
              fetchFollowingList();
            } catch (error: any) {
              // Xử lý lỗi cụ thể
              if (error.response?.status === 401) {
                Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
              } else if (error.response?.status === 400) {
                Alert.alert('Lỗi', error.response?.data || 'Không thể hủy theo dõi người dùng này.');
              } else {
                Alert.alert('Lỗi', 'Không thể hủy theo dõi. Vui lòng thử lại.');
              }
            }
          }
        }
      ]
    );
  };

  const renderFollowingItem = ({ item }: { item: FollowedUser }) => (
    <View style={styles.followingItem}>
      <TouchableOpacity 
        style={styles.userSection}
        onPress={() => handleUserPress(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ 
            uri: item.avatarUrl || 'https://via.placeholder.com/50x50?text=No+Avatar' 
          }}
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=No+Avatar' }}
        />
        <View style={styles.userInfo}>
          <Text style={styles.fullName}>{item.fullName}</Text>
        </View>
      </TouchableOpacity>
      
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.unfollowButton}
          onPress={() => handleUnfollow(item.id, item.fullName)}
          activeOpacity={0.7}
        >
          <UserMinus size={16} color="#ff3b30" />
          <Text style={styles.unfollowText}>Hủy</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (followingList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Chưa theo dõi ai</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sub-tabs */}
      <View style={styles.subTabs}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'following' && styles.activeSubTab]}
          onPress={() => {
            console.log('👆 [FollowingList] Following sub-tab pressed');
            setActiveSubTab('following');
          }}
          activeOpacity={0.7}
        >
          <Users size={18} color={activeSubTab === 'following' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.subTabText, activeSubTab === 'following' && styles.activeSubTabText]}>
            Đang theo dõi ({followingList.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'followers' && styles.activeSubTab]}
          onPress={() => {
            console.log('👆 [FollowingList] Followers sub-tab pressed');
            setActiveSubTab('followers');
          }}
          activeOpacity={0.7}
        >
          <Users size={18} color={activeSubTab === 'followers' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.subTabText, activeSubTab === 'followers' && styles.activeSubTabText]}>
            Người theo dõi tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tab Content */}
      {activeSubTab === 'following' ? (
        <View style={styles.subTabContent}>
          <FlatList
            data={followingList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFollowingItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.subTabContent}>
          <FollowersList userId={userId} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  subTab: {
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
  activeSubTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  subTabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeSubTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  subTabContent: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unfollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff3b30',
    gap: 4,
  },
  unfollowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff3b30',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default FollowingList;
