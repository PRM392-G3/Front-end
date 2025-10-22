import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import ChatListItem from '@/components/ChatListItem';
import { Search, CreditCard as Edit3 } from 'lucide-react-native';

export default function ChatListScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity>
          <Edit3 size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
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
