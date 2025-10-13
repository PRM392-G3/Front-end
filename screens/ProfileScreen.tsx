import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import { Settings, MapPin, Calendar, Link as LinkIcon, Users, Grid2x2 as Grid, LogOut, Mail, Phone } from 'lucide-react-native';
import PostCard from '@/components/PostCard';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  const { user, logout } = useAuth();
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
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </View>

          <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.bio}>
            {user?.bio || 'Chưa có tiểu sử'}
          </Text>

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{user?.email || 'Chưa có email'}</Text>
          </View>

          {user?.phoneNumber && (
            <View style={styles.infoRow}>
              <Phone size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{user.phoneNumber}</Text>
            </View>
          )}

          {user?.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>
              Tham gia {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton}>
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
});
