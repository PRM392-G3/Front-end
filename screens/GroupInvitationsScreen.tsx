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
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Users, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { groupAPI, GroupInvitation } from '@/services/api';

export default function GroupInvitationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitations, setProcessingInvitations] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const invitationsList = await groupAPI.getPendingInvitationsForUser(user.id);
      setInvitations(invitationsList);
    } catch (error: any) {
      console.error('Error loading group invitations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách lời mời');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation: GroupInvitation) => {
    if (!user) return;

    setProcessingInvitations(prev => new Set(prev).add(invitation.id));

    try {
      await groupAPI.acceptInvitation(invitation.groupId, user.id);
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      Alert.alert('Thành công', `Bạn đã tham gia nhóm "${invitation.group.name}"`);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận lời mời');
    } finally {
      setProcessingInvitations(prev => {
        const updated = new Set(prev);
        updated.delete(invitation.id);
        return updated;
      });
    }
  };

  const handleReject = async (invitation: GroupInvitation) => {
    if (!user) return;

    Alert.alert(
      'Từ chối lời mời',
      `Bạn có chắc chắn muốn từ chối lời mời tham gia nhóm "${invitation.group.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setProcessingInvitations(prev => new Set(prev).add(invitation.id));

            try {
              await groupAPI.rejectInvitation(invitation.groupId, user.id);
              
              // Remove from list
              setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
              
              Alert.alert('Đã từ chối', 'Đã từ chối lời mời tham gia nhóm');
            } catch (error: any) {
              console.error('Error rejecting invitation:', error);
              Alert.alert('Lỗi', error.message || 'Không thể từ chối lời mời');
            } finally {
              setProcessingInvitations(prev => {
                const updated = new Set(prev);
                updated.delete(invitation.id);
                return updated;
              });
            }
          },
        },
      ]
    );
  };

  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => {
    const isProcessing = processingInvitations.has(item.id);

    return (
      <View style={styles.invitationItem}>
        <TouchableOpacity
          style={styles.invitationInfo}
          onPress={() => router.push(`/group-detail?id=${item.groupId}` as any)}
          disabled={isProcessing}
        >
          <View style={styles.groupAvatar}>
            {item.group.avatarUrl ? (
              <Image source={{ uri: item.group.avatarUrl }} style={styles.groupAvatarImage} />
            ) : (
              <Users size={24} color={COLORS.white} />
            )}
          </View>
          <View style={styles.invitationDetails}>
            <Text style={styles.groupName}>{item.group.name}</Text>
            <Text style={styles.invitationText}>
              <Text style={styles.inviterName}>{item.invitedByUser.fullName}</Text>
              {' mời bạn tham gia nhóm'}
            </Text>
            <Text style={styles.invitationTime}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Check size={16} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>Chấp nhận</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            <X size={16} color={COLORS.text.secondary} />
            <Text style={styles.rejectButtonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Lời mời nhóm</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Invitations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lời mời...</Text>
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color={COLORS.gray} />
          <Text style={styles.emptyText}>Không có lời mời nào</Text>
          <Text style={styles.emptySubText}>
            Khi có người mời bạn vào nhóm, lời mời sẽ hiển thị ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitationItem}
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
  invitationItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: RESPONSIVE_SPACING.md,
    marginTop: RESPONSIVE_SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  invitationInfo: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
  },
  invitationDetails: {
    marginLeft: RESPONSIVE_SPACING.md,
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  invitationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  inviterName: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  invitationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.xs,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  rejectButton: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  rejectButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});

