import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Users, Settings, Share2, MoreHorizontal } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { groupAPI, Group } from '@/services/api';

export default function GroupDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const groupData = await groupAPI.getGroupById(Number(id));
      setGroup(groupData);
      
      // Check if user is member/admin
      if (user) {
        // User is admin if they created the group
        const isUserAdmin = groupData.createdById === user.id;
        setIsAdmin(isUserAdmin);
        
        // Check membership using API
        const membershipStatus = await groupAPI.checkMembership(groupData.id, user.id);
        setIsMember(membershipStatus);
        
        console.log('Group membership status:', {
          isAdmin: isUserAdmin,
          isMember: membershipStatus
        });
      }
    } catch (error: any) {
      console.error('Error loading group details:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin nhóm');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !group) return;

    setIsLoadingAction(true);
    try {
      // TODO: Implement join group API when available
      Alert.alert('Thành công', 'Đã tham gia nhóm');
      
      // Refresh membership status from API
      const membershipStatus = await groupAPI.checkMembership(group.id, user.id);
      setIsMember(membershipStatus);
      
      // Optionally reload full group details to update member count
      loadGroupDetails();
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tham gia nhóm');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !group) return;

    Alert.alert(
      'Rời nhóm',
      'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            setIsLoadingAction(true);
            try {
              await groupAPI.leaveGroup(group.id, user.id);
              
              // Refresh membership status from API
              const membershipStatus = await groupAPI.checkMembership(group.id, user.id);
              setIsMember(membershipStatus);
              
              Alert.alert('Thành công', 'Đã rời khỏi nhóm');
              
              // Optionally reload full group details to update member count
              loadGroupDetails();
            } catch (error: any) {
              console.error('Error leaving group:', error);
              Alert.alert('Lỗi', error.message || 'Không thể rời nhóm');
            } finally {
              setIsLoadingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleInviteMembers = () => {
    if (!group) return;
    router.push(`/invite-to-group?groupId=${group.id}` as any);
  };

  const handleShareGroup = () => {
    // TODO: Implement share functionality
    Alert.alert('Tính năng', 'Tính năng chia sẻ sẽ được phát triển');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin nhóm...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy nhóm</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {group.coverImageUrl ? (
            <Image source={{ uri: group.coverImageUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Users size={48} color={COLORS.gray} />
            </View>
          )}
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <View style={styles.avatarContainer}>
              {group.avatarUrl ? (
                <Image source={{ uri: group.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Users size={24} color={COLORS.gray} />
                </View>
              )}
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.memberCount} thành viên • {group.privacy === 'private' ? 'Riêng tư' : 'Công khai'}
              </Text>
            </View>
          </View>

          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}

          {/* Created By */}
          <View style={styles.createdBy}>
            <Text style={styles.createdByLabel}>Tạo bởi:</Text>
            <Text style={styles.createdByName}>{group.createdBy.fullName}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isMember ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleInviteMembers}>
                <Users size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Mời thành viên</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleShareGroup}>
                <Share2 size={20} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Chia sẻ</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.joinButton, isLoadingAction && styles.joinButtonDisabled]} 
              onPress={handleJoinGroup}
              disabled={isLoadingAction}
            >
              {isLoadingAction ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.joinButtonText}>Tham gia nhóm</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Group Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{group.memberCount}</Text>
            <Text style={styles.statLabel}>Thành viên</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sự kiện</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>Chưa có hoạt động nào</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {isMember && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.bottomButton, isLoadingAction && styles.bottomButtonDisabled]} 
            onPress={handleLeaveGroup}
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <ActivityIndicator size="small" color={COLORS.text.secondary} />
            ) : (
              <Text style={styles.bottomButtonText}>Rời nhóm</Text>
            )}
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={styles.bottomButton} onPress={() => Alert.alert('Tính năng', 'Tính năng cài đặt nhóm sẽ được phát triển')}>
              <Settings size={20} color={COLORS.text.secondary} />
              <Text style={styles.bottomButtonText}>Cài đặt</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: RESPONSIVE_SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginHorizontal: RESPONSIVE_SPACING.md,
  },
  content: {
    flex: 1,
  },
  coverContainer: {
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  groupInfo: {
    padding: RESPONSIVE_SPACING.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatarContainer: {
    marginRight: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  groupDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    lineHeight: 22,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  createdBy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createdByLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginRight: RESPONSIVE_SPACING.xs,
  },
  createdByName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: RESPONSIVE_SPACING.xs,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: RESPONSIVE_SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'center',
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: RESPONSIVE_SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  activityContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  emptyActivityText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
    gap: RESPONSIVE_SPACING.sm,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: RESPONSIVE_SPACING.xs,
  },
  bottomButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  bottomButtonDisabled: {
    opacity: 0.6,
  },
});