import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { Settings, MapPin, Calendar, Link as LinkIcon, Users, Grid2x2 as Grid, LogOut, Mail, Phone } from 'lucide-react-native';
import PostCard from '@/components/PostCard';
import { userAPI, UpdateUserPayload, postAPI, PostResponse } from '@/services/api';
import { FileUploadResponse } from '@/services/mediaAPI';
import ImageUploader from '@/components/ImageUploader';
import SimpleImageUploader from '@/components/SimpleImageUploader';
import { useAuth } from '@/contexts/AuthContext';
import { usePostContext } from '@/contexts/PostContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  const { user, logout, token } = useAuth();
  const { updatePostShare, getPostShareState } = usePostContext();
  const [displayUser, setDisplayUser] = useState(user);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPosts, setUserPosts] = useState<PostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [form, setForm] = useState<UpdateUserPayload>({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    coverImageUrl: user?.coverImageUrl || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    location: user?.location || '',
  });
  const [dobDay, setDobDay] = useState<string>(() => {
    if (!user?.dateOfBirth) return '';
    const d = new Date(user.dateOfBirth);
    return d.getDate() ? String(d.getDate()) : '';
  });
  const [dobMonth, setDobMonth] = useState<string>(() => {
    if (!user?.dateOfBirth) return '';
    const d = new Date(user.dateOfBirth);
    return d.getMonth() + 1 ? String(d.getMonth() + 1) : '';
  });
  const [dobYear, setDobYear] = useState<string>(() => {
    if (!user?.dateOfBirth) return '';
    const d = new Date(user.dateOfBirth);
    return d.getFullYear() ? String(d.getFullYear()) : '';
  });
  const insets = useSafeAreaInsets();

  const fetchUserPosts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingPosts(true);
      
      // Fetch both original posts and shared posts
      const [originalPosts, sharedPosts] = await Promise.all([
        postAPI.getPostsByUser(user.id),
        postAPI.getSharedPostsByUser(user.id)
      ]);
      
      // Combine and sort by creation date (newest first)
      const allPosts = [...originalPosts, ...sharedPosts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setUserPosts(allPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user?.id]);

  const handlePostDeleted = useCallback((postId: number) => {
    setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  const handleLikeToggle = useCallback((postId: number, isLiked: boolean) => {
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              isLiked, 
              likeCount: isLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1)
            }
          : post
      )
    );
  }, []);

  const handleShareToggle = useCallback((postId: number, isShared: boolean) => {
    // Update local state
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              isShared, 
              shareCount: isShared ? post.shareCount + 1 : Math.max(0, post.shareCount - 1)
            }
          : post
      )
    );
    
    // Update global context for sync with other screens
    updatePostShare(postId, isShared);
  }, [updatePostShare]);

  const handleRefresh = useCallback(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts();
    }
  }, [activeTab, fetchUserPosts]);

  // Sync share states from global context (only when share states change)
  useEffect(() => {
    const hasShareStates = userPosts.some(post => getPostShareState(post.id));
    if (hasShareStates) {
      setUserPosts(prevPosts =>
        prevPosts.map(post => {
          const shareState = getPostShareState(post.id);
          if (shareState && (post.isShared !== shareState.isShared || post.shareCount !== shareState.shareCount)) {
            return {
              ...post,
              isShared: shareState.isShared,
              shareCount: shareState.shareCount
            };
          }
          return post;
        })
      );
    }
  }, [getPostShareState]); // Remove userPosts from dependencies to prevent infinite loop

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      // Combine date of birth
      const dateOfBirth = dobYear && dobMonth && dobDay 
        ? new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay)).toISOString()
        : form.dateOfBirth;
      
      const updateData = {
        ...form,
        dateOfBirth,
      };
      
      const updatedUser = await userAPI.updateUser(user.id, updateData);
      setDisplayUser(updatedUser);
      setEditVisible(false);
      
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {displayUser?.coverImageUrl ? (
            <Image source={{ uri: displayUser.coverImageUrl }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPhoto} />
          )}
          <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
            <LogOut size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {displayUser?.avatarUrl ? (
              <Image source={{ uri: displayUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </View>

          <Text style={styles.name}>{displayUser?.fullName || 'Người dùng'}</Text>
          <Text style={styles.bio}>
            {displayUser?.bio || 'Chưa có tiểu sử'}
          </Text>

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{displayUser?.email || 'Chưa có email'}</Text>
          </View>

          {displayUser?.phoneNumber && (
            <View style={styles.infoRow}>
              <Phone size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{displayUser.phoneNumber}</Text>
            </View>
          )}

          {displayUser?.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{displayUser.location}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>
              Tham gia {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{displayUser?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{displayUser?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{displayUser?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Grid size={20} color={activeTab === 'posts' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Bài viết
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Users size={20} color={activeTab === 'friends' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Bạn bè
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'posts' ? (
          <View>
            {isLoadingPosts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải bài viết...</Text>
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Bạn chưa có bài viết nào</Text>
                <Text style={styles.emptySubtext}>Hãy tạo bài viết đầu tiên của bạn!</Text>
              </View>
            ) : (
              userPosts.map((post, index) => (
                <PostCard
                  key={`profile-post-${post.id}-${index}`}
                  postData={post}
                  onPostDeleted={handlePostDeleted}
                  onLikeToggle={handleLikeToggle}
                  onShareToggle={handleShareToggle}
                  onRefresh={handleRefresh}
                  showImage={!!post.imageUrl || !!post.videoUrl}
                  isSharedPost={post.isShared || false}
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.friendsContainer}>
            <Text style={styles.friendsText}>Danh sách bạn bè sẽ được hiển thị ở đây</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
                placeholder="Nhập họ và tên"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiểu sử</Text>
              <TextInput
                style={styles.input}
                value={form.bio}
                onChangeText={(text) => setForm({ ...form, bio: text })}
                placeholder="Nhập tiểu sử"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              <SimpleImageUploader
                folder="avatars"
                onUploadComplete={(res: FileUploadResponse) => {
                  const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                  if (url) {
                    setForm({ ...form, avatarUrl: url });
                  }
                }}
                onUploadError={(error: any) => {
                  Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện');
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh bìa</Text>
              <SimpleImageUploader
                folder="covers"
                onUploadComplete={(res: FileUploadResponse) => {
                  const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                  if (url) {
                    setForm({ ...form, coverImageUrl: url });
                  }
                }}
                onUploadError={(error: any) => {
                  Alert.alert('Lỗi', 'Không thể tải lên ảnh bìa');
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={form.phoneNumber}
                onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày sinh</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  value={dobDay}
                  onChangeText={setDobDay}
                  placeholder="Ngày"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                  placeholder="Tháng"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh đại diện</Text>
                {form.avatarUrl ? (
                  <Image source={{ uri: form.avatarUrl }} style={styles.previewImage} />
                ) : null}
                <SimpleImageUploader
                  folder="avatars"
                  onUploadComplete={(res: FileUploadResponse) => {
                    const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                    if (url) {
                      setForm({ ...form, avatarUrl: url });
                    }
                  }}
                  onUploadError={(error: any) => {
                    Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh bìa</Text>
                {form.coverImageUrl ? (
                  <Image source={{ uri: form.coverImageUrl }} style={styles.previewCover} />
                ) : null}
                <SimpleImageUploader
                  folder="covers"
                  onUploadComplete={(res: FileUploadResponse) => {
                    if (res.publicUrl) {
                      setForm({ ...form, coverImageUrl: res.publicUrl });
                    }
                  }}
                  onUploadError={(error: any) => {
                    Alert.alert('Lỗi', 'Không thể tải lên ảnh bìa');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={[styles.input, styles.dobInputYear]}
                  value={dobYear}
                  onChangeText={setDobYear}
                  placeholder="Năm"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <Text style={styles.helperText}>Định dạng: Ngày/Tháng/Năm</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Địa chỉ</Text>
              <TextInput
                style={styles.input}
                value={form.location}
                onChangeText={(text) => setForm({ ...form, location: text })}
                placeholder="Nhập địa chỉ"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'relative',
    height: 200,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
  },
  settingsButton: {
    position: 'absolute',
    top: RESPONSIVE_SPACING.md,
    right: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    padding: RESPONSIVE_SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  },
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
    width: '100%',
  },
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginLeft: RESPONSIVE_SPACING.sm,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: RESPONSIVE_SPACING.md,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: RESPONSIVE_SPACING.md,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  editButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  friendsContainer: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  friendsText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: RESPONSIVE_SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
  },
  modalTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  label: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  previewCover: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.xs,
    backgroundColor: COLORS.lightGray,
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  dobInput: {
    flex: 1,
  },
  dobInputYear: {
    flex: 2,
  },
  helperText: {
    marginTop: 6,
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: RESPONSIVE_SPACING.sm,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  actionBtn: {
    height: 44,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.lightGray,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    color: COLORS.black,
    fontWeight: '600',
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  emptyContainer: {
    paddingVertical: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  emptySubtext: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
});