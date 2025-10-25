import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import ChatListItem from '@/components/ChatListItem';
import { Search as SearchIcon, CreditCard as Edit3, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

interface GroupChat {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  memberCount: number;
}

const SAMPLE_GROUP_CHATS: GroupChat[] = [
  {
    id: '1',
    name: 'Lập trình React Native',
    lastMessage: 'Nguyễn Văn A: Tuyệt vời! 👍',
    unreadCount: 5,
    timestamp: '10 phút',
    memberCount: 5,
  },
  {
    id: '2',
    name: 'Du lịch Việt Nam',
    lastMessage: 'Đã chia sẻ một ảnh',
    unreadCount: 0,
    timestamp: '1 giờ',
    memberCount: 8,
  },
];

export default function ChatListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Edit3 size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchIcon size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện"
          placeholderTextColor={COLORS.gray}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Nhóm
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatList}>
        {activeTab === 'all' ? (
          <>
            {/* Group Chats */}
            {SAMPLE_GROUP_CHATS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupChatItem}
                onPress={() => router.push(`/group-chat?id=${group.id}`)}
              >
                <View style={styles.groupAvatarContainer}>
                  <View style={styles.groupAvatar}>
                    <Users size={24} color={COLORS.white} />
                  </View>
                </View>
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.chatTime}>{group.timestamp}</Text>
                  </View>
                  <View style={styles.messageRow}>
                    <Text style={[styles.lastMessage, group.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                      {group.lastMessage}
                    </Text>
                    {group.unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{group.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Individual Chats */}
            <ChatListItem isOnline={true} hasUnread={true} unreadCount={3} />
            <ChatListItem isOnline={true} hasUnread={false} />
            <ChatListItem isOnline={false} hasUnread={true} unreadCount={1} />
            <ChatListItem isOnline={false} hasUnread={false} />
            <ChatListItem isOnline={true} hasUnread={false} />
            <ChatListItem isOnline={false} hasUnread={false} />
          </>
        ) : (
          <>
            {/* Only Group Chats */}
            {SAMPLE_GROUP_CHATS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupChatItem}
                onPress={() => router.push(`/group-chat?id=${group.id}`)}
              >
                <View style={styles.groupAvatarContainer}>
                  <View style={styles.groupAvatar}>
                    <Users size={24} color={COLORS.white} />
                  </View>
                </View>
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.chatTime}>{group.timestamp}</Text>
                  </View>
                  <View style={styles.messageRow}>
                    <Text style={[styles.lastMessage, group.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                      {group.lastMessage}
                    </Text>
                    {group.unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{group.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  headerActions: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    height: 44,
  },
  searchIcon: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
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
  chatList: {
    flex: 1,
  },
  groupChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
  },
  groupAvatarContainer: {
    position: 'relative',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  chatTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  unreadMessage: {
    color: COLORS.black,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
