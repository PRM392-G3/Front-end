import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import {
  ArrowLeft,
  Users,
  MessageCircle,
  UserPlus,
  Settings,
  Lock,
  Globe,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
}

const SAMPLE_MEMBERS: Member[] = [
  { id: '1', name: 'Nguyễn Văn A', role: 'admin' },
  { id: '2', name: 'Trần Thị B', role: 'admin' },
  { id: '3', name: 'Lê Quang C', role: 'member' },
  { id: '4', name: 'Phạm Thị D', role: 'member' },
  { id: '5', name: 'Hoàng Văn E', role: 'member' },
];

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [isMember, setIsMember] = useState(true);
  const [members, setMembers] = useState(SAMPLE_MEMBERS);

  // Sample group data
  const group = {
    id: params.id as string,
    name: 'Lập trình React Native',
    description: 'Nhóm học React Native và chia sẻ kiến thức lập trình mobile',
    memberCount: 1234,
    isPrivate: false,
    coverImage: '',
  };

  const handleJoinGroup = () => {
    setIsMember(!isMember);
  };

  const renderMember = (member: Member) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        {member.role === 'admin' && (
          <Text style={styles.memberRole}>Quản trị viên</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + RESPONSIVE_SPACING.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nhóm</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverImage}>
          <Users size={48} color={COLORS.primary} />
        </View>

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.groupMeta}>
            {group.isPrivate ? (
              <Lock size={16} color={COLORS.gray} />
            ) : (
              <Globe size={16} color={COLORS.gray} />
            )}
            <Text style={styles.groupType}>
              {group.isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.memberCount}>{group.memberCount} thành viên</Text>
          </View>
          <Text style={styles.groupDescription}>{group.description}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isMember ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => router.push(`/group-chat?id=${group.id}`)}
              >
                <MessageCircle size={20} color={COLORS.white} />
                <Text style={styles.chatButtonText}>Trò chuyện</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.inviteButton]}
                onPress={() => router.push(`/invite-members?groupId=${group.id}`)}
              >
                <UserPlus size={20} color={COLORS.primary} />
                <Text style={styles.inviteButtonText}>Mời</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={handleJoinGroup}
            >
              <UserPlus size={20} color={COLORS.white} />
              <Text style={styles.joinButtonText}>Tham gia nhóm</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Thành viên ({members.length})
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.membersList}>
            {members.slice(0, 5).map(renderMember)}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.aboutText}>{group.description}</Text>
          <View style={styles.aboutItem}>
            {group.isPrivate ? (
              <Lock size={20} color={COLORS.gray} />
            ) : (
              <Globe size={20} color={COLORS.gray} />
            )}
            <Text style={styles.aboutItemText}>
              {group.isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
            </Text>
          </View>
          <View style={styles.aboutItem}>
            <Users size={20} color={COLORS.gray} />
            <Text style={styles.aboutItemText}>
              {group.memberCount} thành viên
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.primary,
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
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  coverImage: {
    height: 200,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  groupName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  groupType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  metaSeparator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  memberCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  groupDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.xs,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  inviteButton: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inviteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
  joinButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  section: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  membersList: {
    gap: RESPONSIVE_SPACING.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  memberAvatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  memberRole: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  aboutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  aboutItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
});

