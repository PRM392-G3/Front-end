import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, UserPlus, Calendar } from 'lucide-react-native';

interface NotificationItemProps {
  type: 'like' | 'comment' | 'friend' | 'event';
  isRead?: boolean;
}

export default function NotificationItem({ type, isRead = false }: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart size={20} color={COLORS.error} fill={COLORS.error} />;
      case 'comment':
        return <MessageCircle size={20} color={COLORS.primary} />;
      case 'friend':
        return <UserPlus size={20} color={COLORS.success} />;
      case 'event':
        return <Calendar size={20} color={COLORS.primary} />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'like':
        return 'đã thích bài viết của bạn';
      case 'comment':
        return 'đã bình luận về bài viết của bạn';
      case 'friend':
        return 'đã gửi lời mời kết bạn';
      case 'event':
        return 'đã mời bạn tham gia sự kiện';
    }
  };

  return (
    <TouchableOpacity style={[styles.container, !isRead && styles.unread]}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.userName}>Nguyễn Văn A</Text>
          {' '}{getMessage()}
        </Text>
        <Text style={styles.time}>2 giờ trước</Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
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
  unread: {
    backgroundColor: COLORS.primary + '10',
  },
  iconContainer: {
    position: 'absolute',
    left: 46,
    top: 34,
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});
