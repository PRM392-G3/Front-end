import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { User, userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ImageUploader from '@/components/ImageUploader';

interface ProfileScreenProps {
  userId?: number;
}

export default function ProfileScreen({ userId }: ProfileScreenProps) {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phoneNumber: '',
    dateOfBirth: '',
    location: '',
    avatarUrl: '',
    coverImageUrl: '',
  });

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      loadUserProfile();
    }
  }, [targetUserId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await userAPI.getUserById(targetUserId!);
      setProfileUser(userData);
      
      // Set form data for editing
      setFormData({
        fullName: userData.fullName,
        bio: userData.bio || '',
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth || '',
        location: userData.location || '',
        avatarUrl: userData.avatarUrl || '',
        coverImageUrl: userData.coverImageUrl || '',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileUser) return;

    try {
      setSaving(true);
      const updatedUser = await userAPI.updateUser(profileUser.id, formData);
      setProfileUser(updatedUser);
      setEditVisible(false);
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (type: 'avatar' | 'cover', result: any) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Url`]: result.publicUrl,
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {profileUser.coverImageUrl ? (
            <Image source={{ uri: profileUser.coverImageUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {profileUser.avatarUrl ? (
              <Image source={{ uri: profileUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profileUser.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{profileUser.fullName}</Text>
          {profileUser.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileUser.postsCount}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileUser.followersCount}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileUser.followingCount}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {isOwnProfile && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditVisible(true)}
            >
              <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Bài viết
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              Giới thiệu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {activeTab === 'posts' ? (
            <View style={styles.postsContainer}>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            </View>
          ) : (
            <View style={styles.aboutContainer}>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Số điện thoại</Text>
                <Text style={styles.aboutValue}>{profileUser.phoneNumber}</Text>
              </View>
              {profileUser.dateOfBirth && (
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Ngày sinh</Text>
                  <Text style={styles.aboutValue}>{profileUser.dateOfBirth}</Text>
                </View>
              )}
              {profileUser.location && (
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Địa chỉ</Text>
                  <Text style={styles.aboutValue}>{profileUser.location}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text style={[styles.modalSaveText, saving && styles.modalSaveTextDisabled]}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Avatar Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              <ImageUploader
                onUploadComplete={(result) => handleImageUpload('avatar', result)}
                folder="avatars"
                maxImages={1}
              />
            </View>

            {/* Cover Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ảnh bìa</Text>
              <ImageUploader
                onUploadComplete={(result) => handleImageUpload('cover', result)}
                folder="covers"
                maxImages={1}
              />
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                placeholder="Nhập họ và tên"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giới thiệu</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholder="Giới thiệu về bản thân"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TextInput
                style={styles.input}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dateOfBirth: text }))}
                placeholder="DD/MM/YYYY"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Địa chỉ</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Nhập địa chỉ"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  coverContainer: {
    height: 200,
    backgroundColor: COLORS.background.secondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.accent.primary + '20',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.background.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background.primary,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  statNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border.primary,
  },
  editButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  contentArea: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.lg,
  },
  postsContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  aboutContainer: {
    gap: RESPONSIVE_SPACING.md,
  },
  aboutItem: {
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  aboutLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  aboutValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalSaveText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  formGroup: {
    marginBottom: RESPONSIVE_SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});