import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { X, Users, Heart } from 'lucide-react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { postAPI, User } from '@/services/api';
import { useRouter } from 'expo-router';

interface PostLikesModalProps {
  visible: boolean;
  onClose: () => void;
  postId: number;
  likeCount: number;
}

export default function PostLikesModal({
  visible,
  onClose,
  postId,
  likeCount,
}: PostLikesModalProps) {
  const [likes, setLikes] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (visible && postId) {
      loadLikes();
    }
  }, [visible, postId]);

  const loadLikes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🚀 [PostLikesModal] Loading likes for post ${postId}`);
      
      const likesData = await postAPI.getPostLikes(postId);
      console.log(`✅ [PostLikesModal] Loaded ${likesData.length} likes`);
      setLikes(likesData);
    } catch (error: any) {
      console.error('❌ [PostLikesModal] Error loading likes:', error);
      setError('Không thể tải danh sách người thích');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: number) => {
    onClose(); // Close modal first
    router.push(`/profile?id=${userId}` as any);
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
      <View style={styles.likeIcon}>
        <Heart size={16} color={COLORS.accent.danger} fill={COLORS.accent.danger} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Heart size={48} color={COLORS.gray} />
      <Text style={styles.emptyText}>Chưa có ai thích bài viết này</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadLikes}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    if (error) {
      return renderError();
    }

    if (likes.length === 0) {
      return renderEmpty();
    }

    return (
      <FlatList
        data={likes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Users size={20} color={COLORS.primary} />
            <Text style={styles.headerTitle}>
              Người đã thích ({likeCount})
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  listContent: {
    paddingVertical: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: RESPONSIVE_SPACING.sm,
    marginVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.secondary,
  } as ViewStyle,
  avatarContainer: {
    marginRight: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  } as ImageStyle,
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.white,
  } as TextStyle,
  userInfo: {
    flex: 1,
  } as ViewStyle,
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  } as TextStyle,
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  userBio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  } as TextStyle,
  likeIcon: {
    marginLeft: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.md,
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent.danger,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as TextStyle,
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.white,
  } as TextStyle,
});
