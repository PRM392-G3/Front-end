import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { User, userAPI } from '@/services/api';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { User as UserIcon, Mail, Phone, MapPin, Calendar, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface UserPreviewFloatingProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  onUserPress?: (userId: number) => void;
  isCurrentUser?: boolean; // If true, allow navigation to full profile
}

export default function UserPreviewFloating({
  visible,
  onClose,
  userId,
  onUserPress,
  isCurrentUser = false,
}: UserPreviewFloatingProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  useEffect(() => {
    if (visible && userId) {
      fetchUser();
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else if (!visible) {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userAPI.getUserById(userId);
      setUser(userData);
    } catch (err: any) {
      console.error('Error fetching user preview:', err);
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    onClose();
    if (onUserPress) {
      onUserPress(userId);
    } else {
      router.push({
        pathname: '/profile',
        params: { userId: userId.toString() }
      } as any);
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={COLORS.black} />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : user ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <UserIcon size={50} color={COLORS.gray} />
                  </View>
                )}
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <Text style={styles.name}>{user.fullName}</Text>
                {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Mail size={16} color={COLORS.darkGray} />
                    <Text style={styles.infoText}>{user.email}</Text>
                  </View>

                  {user.phoneNumber && (
                    <View style={styles.infoRow}>
                      <Phone size={16} color={COLORS.darkGray} />
                      <Text style={styles.infoText}>{user.phoneNumber}</Text>
                    </View>
                  )}

                  {user.location && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={COLORS.darkGray} />
                      <Text style={styles.infoText}>{user.location}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Calendar size={16} color={COLORS.darkGray} />
                    <Text style={styles.infoText}>
                      Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
                    <Text style={styles.statLabel}>Người theo dõi</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.followingCount || 0}</Text>
                    <Text style={styles.statLabel}>Đang theo dõi</Text>
                  </View>
                </View>
              </View>

              {/* Action Button - Only show if isCurrentUser */}
              {isCurrentUser && (
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={handleViewProfile}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewProfileButtonText}>Xem hồ sơ đầy đủ</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : null}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingTop: RESPONSIVE_SPACING.lg,
    paddingBottom: RESPONSIVE_SPACING.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    padding: RESPONSIVE_SPACING.xs,
  },
  loadingContainer: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  },
  errorContainer: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    paddingHorizontal: RESPONSIVE_SPACING.lg,
  },
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  infoSection: {
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.xs,
  },
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border.primary,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.primary,
  },
  viewProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: RESPONSIVE_SPACING.lg,
    marginTop: RESPONSIVE_SPACING.md,
  },
  viewProfileButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
