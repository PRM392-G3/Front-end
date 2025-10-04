import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Settings, MapPin, Calendar, Link as LinkIcon, Users, Grid2x2 as Grid } from 'lucide-react-native';
import PostCard from '@/components/PostCard';
import { useState } from 'react';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.coverPhoto} />
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
          </View>

          <Text style={styles.name}>Nguyễn Văn A</Text>
          <Text style={styles.bio}>
            Yêu thích công nghệ, thiết kế và du lịch
          </Text>

          <View style={styles.infoRow}>
            <MapPin size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>Hà Nội, Việt Nam</Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>Tham gia tháng 3 năm 2023</Text>
          </View>

          <View style={styles.infoRow}>
            <LinkIcon size={16} color={COLORS.darkGray} />
            <Text style={[styles.infoText, styles.link]}>website.com</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,234</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>567</Text>
              <Text style={styles.statLabel}>Bạn bè</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>890</Text>
              <Text style={styles.statLabel}>Theo dõi</Text>
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
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -48,
    marginBottom: SPACING.sm,
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
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  link: {
    color: COLORS.primary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
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
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
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
    padding: SPACING.xs,
  },
  friendCard: {
    width: '33.33%',
    padding: SPACING.xs,
    alignItems: 'center',
  },
  friendAvatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    marginBottom: SPACING.xs,
  },
  friendName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.black,
    textAlign: 'center',
  },
});
