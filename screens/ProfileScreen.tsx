import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { Settings, MapPin, Calendar, Link as LinkIcon, Users, Grid2x2 as Grid, LogOut, Mail, Phone } from 'lucide-react-native';
import PostCard from '@/components/PostCard';
import { useState } from 'react';
import { userAPI, UpdateUserPayload } from '@/services/api';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  const { user, logout, token } = useAuth();
  const [displayUser, setDisplayUser] = useState(user);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateUserPayload>({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    coverImageUrl: '',
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

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.coverPhoto} />
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
            <PostCard showImage={true} />
            <PostCard showImage={false} />
            <PostCard showImage={true} />
          </View>
        ) : (
          <View style={styles.friendsGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View key={item} style={styles.friendCard}>
                <View style={styles.friendAvatar} />
                <Text style={styles.friendName}>Bạn bè {item}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Họ tên</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(t) => setForm({ ...form, fullName: t })}
                  placeholder="Nhập họ tên"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tiểu sử</Text>
                <TextInput
                  style={[styles.input, { height: 88 }]}
                  value={form.bio}
                  onChangeText={(t) => setForm({ ...form, bio: t })}
                  placeholder="Giới thiệu bản thân"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh đại diện</Text>
                {form.avatarUrl ? (
                  <Image source={{ uri: form.avatarUrl }} style={styles.previewImage} />
                ) : null}
                <ImageUploader
                  maxImages={1}
                  folder="avatars"
                  onUploadComplete={(res: any) => {
                    console.log('ProfileScreen: Upload response:', res);
                    // Sử dụng publicUrl thay vì url
                    const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                    console.log('ProfileScreen: Extracted URL:', url);
                    if (url) {
                      setForm({ ...form, avatarUrl: url });
                    } else {
                      console.error('ProfileScreen: No publicUrl found in response');
                    }
                  }}
                  onUploadError={(error) => {
                    console.error('Avatar upload error:', error);
                    Alert.alert('Lỗi', 'Không thể upload ảnh đại diện. Vui lòng thử lại.');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh bìa</Text>
                {form.coverImageUrl ? (
                  <Image source={{ uri: form.coverImageUrl }} style={styles.previewCover} />
                ) : null}
                <ImageUploader
                  maxImages={1}
                  folder="covers"
                  onUploadComplete={(res: any) => {
                    console.log('ProfileScreen: Cover upload response:', res);
                    // Sử dụng publicUrl thay vì url
                    const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                    console.log('ProfileScreen: Extracted cover URL:', url);
                    if (url) {
                      setForm({ ...form, coverImageUrl: url });
                    } else {
                      console.error('ProfileScreen: No publicUrl found in cover response');
                    }
                  }}
                  onUploadError={(error) => {
                    console.error('Cover upload error:', error);
                    Alert.alert('Lỗi', 'Không thể upload ảnh bìa. Vui lòng thử lại.');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={form.phoneNumber}
                  onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
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
                    onChangeText={(t) => {
                      setDobDay(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobInput]}
                    value={dobMonth}
                    onChangeText={(t) => {
                      setDobMonth(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobInputYear]}
                    value={dobYear}
                    onChangeText={(t) => {
                      setDobYear(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <Text style={styles.helperText}>Định dạng: ngày/tháng/năm</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Địa điểm</Text>
                <TextInput
                  style={styles.input}
                  value={form.location}
                  onChangeText={(t) => setForm({ ...form, location: t })}
                  placeholder="Ví dụ: Hà Nội"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setEditVisible(false)} disabled={saving}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn]}
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert('Lỗi', 'Không xác định được người dùng.');
                    return;
                  }
                  try {
                    setSaving(true);
                    // Tính ISO thực từ ngày/tháng/năm nếu có đủ dữ liệu
                    let isoDob = form.dateOfBirth;
                    if (dobDay && dobMonth && dobYear) {
                      const d = new Date(
                        Number(dobYear),
                        Number(dobMonth) - 1,
                        Number(dobDay)
                      );
                      if (!isNaN(d.getTime())) {
                        isoDob = d.toISOString();
                      }
                    }

                    const payload: UpdateUserPayload = {
                      fullName: form.fullName,
                      bio: form.bio,
                      avatarUrl: form.avatarUrl,
                      coverImageUrl: form.coverImageUrl,
                      phoneNumber: form.phoneNumber,
                      dateOfBirth: isoDob,
                      location: form.location,
                    };
                    await userAPI.updateUser(user.id, payload);
                // Optimistically update local display data
                setDisplayUser((prev) => prev ? { ...prev, ...payload } as any : (payload as any));
                    Alert.alert('Thành công', 'Cập nhật hồ sơ thành công.');
                    setEditVisible(false);
                  } catch (e: any) {
                    Alert.alert('Lỗi', e?.response?.data?.message || 'Cập nhật không thành công.');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Lưu</Text>}
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
    backgroundColor: COLORS.lightGray,
  },
  header: {
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.primary + '40',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: RESPONSIVE_SPACING.md,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -48,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
    gap: RESPONSIVE_SPACING.xs,
  },
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  link: {
    color: COLORS.primary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  friendsGrid: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: RESPONSIVE_SPACING.xs,
  },
  friendCard: {
    width: '33.33%',
    padding: RESPONSIVE_SPACING.xs,
    alignItems: 'center',
  },
  friendAvatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  friendName: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.black,
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
});
