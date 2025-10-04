import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';

interface ChatListItemProps {
  isOnline?: boolean;
  hasUnread?: boolean;
  unreadCount?: number;
}

export default function ChatListItem({ isOnline = false, hasUnread = false, unreadCount = 0 }: ChatListItemProps) {
  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar} />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>Nguyễn Văn A</Text>
          <Text style={styles.time}>2 giờ</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={[styles.message, hasUnread && styles.unreadMessage]} numberOfLines={1}>
            Tin nhắn mới nhất từ cuộc trò chuyện này
          </Text>
          {hasUnread && unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
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
    marginLeft: SPACING.sm,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
