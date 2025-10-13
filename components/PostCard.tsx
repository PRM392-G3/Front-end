import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface PostCardProps {
  showImage?: boolean;
  imageUrl?: string;
  postData?: {
    id: number;
    content: string;
    imageUrl?: string;
    user: {
      fullName: string;
      avatarUrl?: string;
    };
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
  };
}

export default function PostCard({ 
  showImage = true, 
  imageUrl,
  postData 
}: PostCardProps) {
  const displayImage = imageUrl || postData?.imageUrl;
  const content = postData?.content || "Hôm nay thật tuyệt vời! Cảm ơn mọi người đã ủng hộ. 🌟 #nexora #happiness";
  const userName = postData?.user?.fullName || "Nguyễn Văn A";
  const timestamp = postData?.createdAt ? new Date(postData.createdAt).toLocaleDateString('vi-VN') : "2 giờ trước";
  const likesCount = postData?.likesCount || 24;
  const commentsCount = postData?.commentsCount || 8;
  const isLiked = postData?.isLiked || false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {postData?.user?.avatarUrl && (
              <Image source={{ uri: postData.user.avatarUrl }} style={styles.avatarImage} />
            )}
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{content}</Text>

      {showImage && displayImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayImage }} style={styles.image} />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Heart size={20} color={isLiked ? COLORS.error : COLORS.gray} />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color={COLORS.gray} />
          <Text style={styles.actionText}>12</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginBottom: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginRight: RESPONSIVE_SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  userText: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    fontWeight: '500',
  },
  moreButton: {
    padding: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  content: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    lineHeight: 24,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    fontWeight: '400',
  },
  imageContainer: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  imageText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.lg,
    paddingTop: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
    paddingVertical: RESPONSIVE_SPACING.xs,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
});
