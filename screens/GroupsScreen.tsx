import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Search, Plus, Users, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatarUrl?: string;
  isPrivate: boolean;
  isMember: boolean;
  lastActivity?: string;
}

const SAMPLE_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Lập trình React Native',
    description: 'Nhóm học React Native và chia sẻ kiến thức',
    memberCount: 1234,
    isPrivate: false,
    isMember: true,
    lastActivity: '5 phút trước',
  },
  {
    id: '2',
    name: 'Du lịch Việt Nam',
    description: 'Khám phá vẻ đẹp Việt Nam',
    memberCount: 567,
    isPrivate: false,
    isMember: true,
    lastActivity: '1 giờ trước',
  },
  {
    id: '3',
    name: 'Ẩm thực Sài Gòn',
    description: 'Review quán ăn ngon Sài Gòn',
    memberCount: 890,
    isPrivate: false,
    isMember: false,
    lastActivity: '2 giờ trước',
  },
  {
    id: '4',
    name: 'Nhóm riêng tư',
    description: 'Nhóm chỉ dành cho thành viên',
    memberCount: 45,
    isPrivate: true,
    isMember: true,
    lastActivity: '30 phút trước',
  },
];

export default function GroupsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filteredGroups = SAMPLE_GROUPS.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'my-groups' ? group.isMember : !group.isMember;
    return matchesSearch && matchesTab;
  });

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/group-detail?id=${item.id}`)}
    >
      <View style={styles.groupAvatar}>
        <Users size={32} color={COLORS.primary} />
      </View>
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isPrivate && <Lock size={16} color={COLORS.gray} />}
        </View>
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.groupMeta}>
          <Text style={styles.groupMembers}>
            {item.memberCount} thành viên
          </Text>
          {item.lastActivity && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.groupActivity}>{item.lastActivity}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + RESPONSIVE_SPACING.md }]}>
        <Text style={styles.headerTitle}>Nhóm</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-group')}
        >
          <Plus size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm nhóm..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-groups' && styles.activeTab]}
          onPress={() => setActiveTab('my-groups')}
        >
          <Text
            style={[styles.tabText, activeTab === 'my-groups' && styles.activeTabText]}
          >
            Nhóm của bạn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text
            style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}
          >
            Khám phá
          </Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'my-groups' ? 'Chưa có nhóm nào' : 'Không tìm thấy nhóm'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'my-groups'
                ? 'Tham gia hoặc tạo nhóm mới để bắt đầu'
                : 'Thử tìm kiếm với từ khóa khác'}
            </Text>
          </View>
        }
      />
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
    paddingBottom: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    height: 44,
  },
  searchIcon: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.lg,
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  groupAvatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
    marginBottom: 4,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  groupDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembers: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    marginHorizontal: 6,
  },
  groupActivity: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: RESPONSIVE_SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  },
});
