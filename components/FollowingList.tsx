import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { userAPI, FollowedUser } from '../services/api';
import { useRouter } from 'expo-router';
import { UserMinus } from 'lucide-react-native';

interface FollowingListProps {
  userId: number; // ID của user hiện tại (follower)
}

const FollowingList: React.FC<FollowingListProps> = ({ userId }) => {
  const [followingList, setFollowingList] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFollowingList();
  }, [userId]);

  const fetchFollowingList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userAPI.getFollowingList(userId);
      setFollowingList(data);
    } catch (err) {
      console.error('Error fetching following list:', err);
      setError('Không thể tải danh sách người theo dõi');
      Alert.alert('Lỗi', 'Không thể tải danh sách người theo dõi');
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
      
      <TouchableOpacity 
        style={styles.unfollowButton}
        onPress={() => handleUnfollow(item.id, item.fullName)}
        activeOpacity={0.7}
      >
        <UserMinus size={16} color="#ff3b30" />
        <Text style={styles.unfollowText}>Hủy</Text>
      </TouchableOpacity>
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
      <Text style={styles.title}>Danh sách người theo dõi ({followingList.length})</Text>
      <FlatList
        data={followingList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFollowingItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
