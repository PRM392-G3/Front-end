import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import ChatListItem from '@/components/ChatListItem';
import { Search as SearchIcon, CreditCard as Edit3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ChatListScreen() {
  const router = useRouter();
  
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

      <ScrollView style={styles.chatList}>
        <ChatListItem isOnline={true} hasUnread={true} unreadCount={3} />
        <ChatListItem isOnline={true} hasUnread={false} />
        <ChatListItem isOnline={false} hasUnread={true} unreadCount={1} />
        <ChatListItem isOnline={false} hasUnread={false} />
        <ChatListItem isOnline={true} hasUnread={false} />
        <ChatListItem isOnline={false} hasUnread={false} />
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
  chatList: {
    flex: 1,
  },
});
