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
  FlatList,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Users, Settings, Share2, MoreHorizontal, Plus, Edit3, MessageCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { groupAPI, Group, PostResponse } from '@/services/api';
import PostCard from '@/components/PostCard';
import CreateGroupPostScreen from '@/screens/CreateGroupPostScreen';

export default function GroupDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasPendingInvitation, setHasPendingInvitation] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
      loadGroupPosts();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const groupData = await groupAPI.getGroupById(Number(id));
      setGroup(groupData);
      
      // Check user status with group
      if (user) {
        const status = await groupAPI.checkUserGroupStatus(groupData.id, user.id);
        setIsMember(status.isMember);
        setUserRole(status.role || null);
        setIsAdmin(status.role === 'admin');
        
        // Check if user has pending request
        await checkPendingRequest(groupData.id, user.id);
        
        console.log('Group user status:', status);
      }
    } catch (error: any) {
      console.error('Error loading group details:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin nhóm');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingRequest = async (groupId: number, userId: number) => {
    try {
      // Check user's join status with group using new API
      const joinStatus = await groupAPI.getGroupJoinStatus(groupId, userId);
      
      setRequestSent(joinStatus.status === 'pending');
      console.log('Join status check:', { joinStatus, requestSent: joinStatus.status === 'pending' });
    } catch (error: any) {
      console.error('Error checking join status:', error);
      setRequestSent(false);
    }
  };

  const loadGroupPosts = async () => {
    try {
      setLoadingPosts(true);
      const groupPosts = await groupAPI.getGroupPostsWithLikes(Number(id));
      setPosts(groupPosts);
      console.log('Loaded group posts:', groupPosts.length);
    } catch (error: any) {
      console.error('Error loading group posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!user || !group) return;

    setIsLoadingAction(true);
    try {
      await groupAPI.requestToJoinGroup(group.id, user.id);
      setRequestSent(true);
      Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia nhóm. Vui lòng chờ admin duyệt.');
      
      // Reload pending request status to ensure consistency
      await checkPendingRequest(group.id, user.id);
    } catch (error: any) {
      console.error('Error requesting to join group:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi yêu cầu tham gia');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || !group) return;

    setIsLoadingAction(true);
    try {
      await groupAPI.acceptInvitation(group.id, user.id);
      Alert.alert('Thành công', 'Đã tham gia nhóm!');
      
      // Reload group details
      loadGroupDetails();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Lỗi', error.message || 'Không thể chấp nhận lời mời');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!user || !group) return;

    Alert.alert(
      'Từ chối lời mời',
      'Bạn có chắc chắn muốn từ chối lời mời tham gia nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setIsLoadingAction(true);
            try {
              await groupAPI.rejectInvitation(group.id, user.id);
              Alert.alert('Thành công', 'Đã từ chối lời mời');
              
              // Reload group details
              loadGroupDetails();
            } catch (error: any) {
              console.error('Error rejecting invitation:', error);
              Alert.alert('Lỗi', error.message || 'Không thể từ chối lời mời');
            } finally {
              setIsLoadingAction(false);
            }
          }
        }
      ]
    );
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

  const handleCreatePost = () => {
    // Double check permission before showing create post screen
    if (!isMember) {
      Alert.alert('Không có quyền', 'Bạn cần là thành viên của nhóm để đăng bài');
      return;
    }
    
    if (!group?.isActive) {
      Alert.alert('Nhóm không hoạt động', 'Nhóm này đã bị vô hiệu hóa');
      return;
    }
    
    setShowCreatePost(true);
  };

  const handlePostCreated = (newPost: PostResponse) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
    // Reload posts to ensure consistency
    setTimeout(() => {
      loadGroupPosts();
    }, 1000);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost: PostResponse) => {
    setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
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

  // Show create post screen if requested
  if (showCreatePost && group) {
    return (
      <CreateGroupPostScreen
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
        groupId={group.id}
        group={group}
      />
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
              {/* Chat Button - Full width */}
              <TouchableOpacity 
                style={styles.chatButton} 
                onPress={() => router.push(`/group-chat?id=${group.id}` as any)}
              >
                <MessageCircle size={20} color={COLORS.white} />
                <Text style={styles.chatButtonText}>Chat nhóm</Text>
              </TouchableOpacity>

              {/* Create Post Button - Full width */}
              <TouchableOpacity 
                style={styles.createPostButton} 
                onPress={handleCreatePost}
              >
                <Edit3 size={20} color={COLORS.white} />
                <Text style={styles.createPostButtonText}>Đăng bài trong nhóm</Text>
              </TouchableOpacity>

              {/* Admin buttons - Full width */}
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.fullWidthButton} 
                  onPress={() => router.push(`/group-pending-requests?id=${group.id}`)}
                >
                  <Settings size={20} color={COLORS.white} />
                  <Text style={styles.fullWidthButtonText}>Quản lý yêu cầu</Text>
                </TouchableOpacity>
              )}
              
              {/* Member/Admin buttons - Two columns */}
              <View style={styles.twoColumnButtons}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleInviteMembers}>
                  <Users size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Mời thành viên</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleShareGroup}>
                  <Share2 size={20} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Chia sẻ</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : requestSent ? (
            /* Request already sent */
            <View style={styles.pendingButton}>
              <Text style={styles.pendingButtonText}>Đã gửi yêu cầu</Text>
            </View>
          ) : (
            /* User can request to join */
            <TouchableOpacity 
              style={[styles.joinButton, isLoadingAction && styles.joinButtonDisabled]} 
              onPress={handleRequestToJoin}
              disabled={isLoadingAction}
            >
              {isLoadingAction ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.joinButtonText}>Yêu cầu tham gia</Text>
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
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sự kiện</Text>
          </View>
        </View>

        {/* Group Posts */}
        <View style={styles.postsContainer}>
          <Text style={styles.sectionTitle}>Bài viết trong nhóm</Text>
          {loadingPosts ? (
            <View style={styles.loadingPostsContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingPostsText}>Đang tải bài viết...</Text>
            </View>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postData={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                showImage={true}
              />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsText}>
                {isMember 
                  ? 'Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!' 
                  : 'Chưa có bài viết nào trong nhóm'}
              </Text>
            </View>
          )}
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
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
    gap: RESPONSIVE_SPACING.sm,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  chatButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: RESPONSIVE_SPACING.xs,
  },
  createPostButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
  pendingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray,
    alignSelf: 'center',
  },
  pendingButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: RESPONSIVE_SPACING.xs,
  },
  fullWidthButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  twoColumnButtons: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.sm,
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
  postsContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  loadingPostsContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  loadingPostsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyPostsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
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