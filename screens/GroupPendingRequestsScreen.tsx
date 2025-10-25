import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, UserCheck, X, Users } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { groupAPI, GroupInvitation } from '@/services/api';

export default function GroupPendingRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'requests' | 'invitations'>('requests');
  const [requests, setRequests] = useState<GroupInvitation[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (id) {
      loadPendingItems();
    }
  }, [id, activeTab]);

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      const groupId = Number(id);
      
      if (activeTab === 'requests') {
        // Load pending join requests (users requesting to join)
        const requestsData = await groupAPI.getGroupPendingRequests(groupId);
        setRequests(requestsData);
      } else {
        // Load pending invitations (member-invited users waiting for admin approval)
        const invitationsData = await groupAPI.getGroupPendingInvitations(groupId);
        setInvitations(invitationsData);
      }
    } catch (error: any) {
      console.error('Error loading pending items:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: GroupInvitation) => {
    if (!id || !item.user) return;

    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      if (activeTab === 'requests') {
        // Duyệt request (user xin vào trực tiếp)
        await groupAPI.approveRequest(Number(id), item.user!.id);
        Alert.alert('Thành công', 'Đã duyệt yêu cầu tham gia');
        setRequests(prev => prev.filter(request => request.id !== item.id));
      } else {
        // Duyệt invitation (user được mời bởi member)
        await groupAPI.approveInvitation(Number(id), item.user!.id);
        Alert.alert('Thành công', 'Đã duyệt lời mời');
        setInvitations(prev => prev.filter(invitation => invitation.id !== item.id));
      }
    } catch (error: any) {
      console.error('Error approving:', error);
      Alert.alert('Lỗi', error.message || 'Không thể duyệt');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleReject = async (item: GroupInvitation) => {
    if (!id || !item.user) return;

    const title = activeTab === 'requests' ? 'Từ chối yêu cầu' : 'Từ chối lời mời';
    const message = activeTab === 'requests' 
      ? 'Bạn có chắc chắn muốn từ chối yêu cầu tham gia này?' 
      : 'Bạn có chắc chắn muốn từ chối lời mời này?';

    Alert.alert(
      title,
      message,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(item.id));
            try {
              if (activeTab === 'requests') {
                // Từ chối request (user xin vào trực tiếp)
                await groupAPI.rejectRequest(Number(id), item.user!.id);
                Alert.alert('Thành công', 'Đã từ chối yêu cầu tham gia');
                setRequests(prev => prev.filter(request => request.id !== item.id));
              } else {
                // Từ chối invitation (user được mời bởi member)
                await groupAPI.rejectInvitation(Number(id), item.user!.id);
                Alert.alert('Thành công', 'Đã từ chối lời mời');
                setInvitations(prev => prev.filter(invitation => invitation.id !== item.id));
              }
            } catch (error: any) {
              console.error('Error rejecting:', error);
              Alert.alert('Lỗi', error.message || 'Không thể từ chối');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: GroupInvitation }) => {
    const isProcessing = processingIds.has(item.id);
    const targetUser = item.user; // For requests, this is the user requesting to join
    
    if (!targetUser) {
      return null; // Skip rendering if no user data
    }
    
    return (
      <View style={styles.requestItem}>
        <Image 
          source={{ uri: targetUser.avatarUrl || 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.userName}>{targetUser.fullName}</Text>
          <Text style={styles.requestType}>
            {activeTab === 'requests' 
              ? 'Yêu cầu tham gia nhóm' 
              : `Được mời bởi ${item.invitedByUser?.fullName || 'Unknown'}`
            }
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <UserCheck size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <X size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => {
    const isProcessing = processingIds.has(item.id);
    const targetUser = item.user; // For invitations, this is the invited user
    
    if (!targetUser) return null;

    return (
      <View style={styles.requestItem}>
        <Image 
          source={{ uri: targetUser.avatarUrl || 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.userName}>{targetUser.fullName}</Text>
          <Text style={styles.requestType}>
            Được mời bởi {item.invitedByUser?.fullName || 'Unknown'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <UserCheck size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <X size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentData = activeTab === 'requests' ? requests : invitations;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý yêu cầu</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Yêu cầu tham gia ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.activeTabText]}>
            Chờ duyệt ({invitations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>
            {activeTab === 'requests' 
              ? 'Không có yêu cầu tham gia nào'
              : 'Không có lời mời chờ duyệt'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={activeTab === 'requests' ? renderRequestItem : renderInvitationItem}
          contentContainerStyle={styles.listContent}
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  listContent: {
    padding: RESPONSIVE_SPACING.md,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    marginRight: RESPONSIVE_SPACING.md,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  requestType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.xs,
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accent.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

