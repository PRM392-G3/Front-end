import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Search, UserPlus, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, User, groupAPI } from '@/services/api';

export default function InviteToGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const { groupId } = useLocalSearchParams();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingUsers, setInvitingUsers] = useState<Set<number>>(new Set());
  const [invitedUsers, setInvitedUsers] = useState<Set<number>>(new Set());
  const [memberUsers, setMemberUsers] = useState<Set<number>>(new Set());
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    if (currentUser && groupId) {
      checkUserRole();
      loadFriends();
      checkMemberships();
    }
  }, [currentUser, groupId]);

  const checkUserRole = async () => {
    if (!currentUser || !groupId) return;

    try {
      const roleData = await groupAPI.getUserRoleInGroup(Number(groupId), currentUser.id);
      setUserRole(roleData.role);
      console.log('User role in group:', roleData.role);
    } catch (error: any) {
      console.error('Error checking user role:', error);
    }
  };

  const loadFriends = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const friendsList = await userAPI.getFriends(currentUser.id);
      setFriends(friendsList);
    } catch (error: any) {
      console.error('Error loading friends:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  };

  const checkMemberships = async () => {
    if (!currentUser || !groupId) return;

    try {
      const friendsList = await userAPI.getFriends(currentUser.id);
      const memberChecks = await Promise.all(
        friendsList.map(friend => 
          groupAPI.checkMembership(Number(groupId), friend.id)
        )
      );

      const members = new Set<number>();
      friendsList.forEach((friend, index) => {
        if (memberChecks[index]) {
          members.add(friend.id);
        }
      });

      setMemberUsers(members);
    } catch (error: any) {
      console.error('Error checking memberships:', error);
    }
  };

  const handleInvite = async (friendId: number) => {
    if (!currentUser || !groupId) return;

    setInvitingUsers(prev => new Set(prev).add(friendId));

    try {
      await groupAPI.inviteToGroup({
        groupId: Number(groupId),
        userId: friendId,
        invitedById: currentUser.id,
        role: 'member'
      });

      setInvitedUsers(prev => new Set(prev).add(friendId));
      
      // Hiển thị message khác nhau tùy role
      if (userRole === 'admin') {
        Alert.alert(
          'Thành công', 
          'Đã gửi lời mời! User sẽ được tự động thêm vào nhóm.'
        );
      } else {
        Alert.alert(
          'Thành công', 
          'Đã gửi lời mời! Yêu cầu sẽ chờ admin duyệt trước khi user được thêm vào nhóm.'
        );
      }
    } catch (error: any) {
      console.error('Error inviting user:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời');
    } finally {
      setInvitingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(friendId);
        return updated;
      });
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }: { item: User }) => {
    const isInviting = invitingUsers.has(item.id);
    const isInvited = invitedUsers.has(item.id);
    const isMember = memberUsers.has(item.id);

    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserPlus size={24} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.fullName}</Text>
            {item.bio && (
              <Text style={styles.friendBio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </View>
        </View>

        {isMember ? (
          <View style={[styles.inviteButton, styles.memberButton]}>
            <Check size={16} color={COLORS.white} />
            <Text style={styles.inviteButtonText}>Đã tham gia</Text>
          </View>
        ) : isInvited ? (
          <View style={[styles.inviteButton, styles.invitedButton]}>
            <Check size={16} color={COLORS.white} />
            <Text style={styles.inviteButtonText}>Đã mời</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => handleInvite(item.id)}
            disabled={isInviting}
          >
            {isInviting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <UserPlus size={16} color={COLORS.white} />
                <Text style={styles.inviteButtonText}>Mời</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mời thành viên</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bạn bè..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Friends List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <UserPlus size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy kết bạn để mời họ vào nhóm'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: RESPONSIVE_SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendDetails: {
    marginLeft: RESPONSIVE_SPACING.md,
    flex: 1,
  },
  friendName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  friendBio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  inviteButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  invitedButton: {
    backgroundColor: COLORS.darkGray,
  },
  memberButton: {
    backgroundColor: COLORS.success,
  },
});

