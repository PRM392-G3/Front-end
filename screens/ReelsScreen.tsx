import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Camera,
  Search as SearchIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { API } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { VideoView, useVideoPlayer } from 'expo-video';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelData {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  videoUrl: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isFollowing: boolean;
}

// Dữ liệu mẫu
const SAMPLE_REELS: ReelData[] = [
  {
    id: '1',
    userId: '1',
    username: 'nguyenvana',
    userAvatar: '',
    videoUrl: '',
    description: 'Cảnh đẹp tuyệt vời ở Việt Nam 🇻🇳 #travel #vietnam',
    likes: 12500,
    comments: 234,
    shares: 89,
    isLiked: false,
    isFollowing: false,
  },
  {
    id: '2',
    userId: '2',
    username: 'tranthib',
    userAvatar: '',
    videoUrl: '',
    description: 'Chia sẻ công thức làm bánh mì 🥖 #cooking #food',
    likes: 8900,
    comments: 156,
    shares: 45,
    isLiked: true,
    isFollowing: true,
  },
  {
    id: '3',
    userId: '3',
    username: 'lequangc',
    userAvatar: '',
    videoUrl: '',
    description: 'Workout routine buổi sáng 💪 #fitness #health',
    likes: 15600,
    comments: 289,
    shares: 102,
    isLiked: false,
    isFollowing: false,
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

interface ReelItemProps {
  reel: any; // ReelResponse from API
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onFollow: () => void;
  isMuted: boolean;
}

const ReelItem = ({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onFollow,
  isMuted,
}: ReelItemProps) => {
  // Create video player instance
  const player = useVideoPlayer(reel.videoUrl || '', (player) => {
    player.loop = true;
    player.muted = isMuted;
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  });

  // Update playback when active state changes
  useEffect(() => {
    if (isActive && player) {
      player.play();
    } else if (player) {
      player.pause();
    }
  }, [isActive, player]);

  // Update mute state
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  return (
    <View style={styles.reelContainer}>
      {/* Video player */}
      {reel.videoUrl ? (
        <VideoView
          style={styles.videoPlayer}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.placeholderText}>NO VIDEO</Text>
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        {/* User info */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            {reel.user?.avatarUrl ? (
              <Image 
                source={{ uri: reel.user.avatarUrl }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {reel.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.username}>{reel.user?.fullName || 'Unknown'}</Text>
          </View>
          {reel.caption && (
            <Text style={styles.description}>{reel.caption}</Text>
          )}
        </View>

        {/* Side actions */}
        <View style={styles.sideActions}>
          {/* Like */}
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Heart
              size={28}
              color={COLORS.white}
              fill={reel.isLiked ? COLORS.error : 'transparent'}
            />
            <Text style={styles.actionText}>{reel.likeCount || 0}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MessageCircle size={28} color={COLORS.white} />
            <Text style={styles.actionText}>{reel.commentCount || 0}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Share2 size={28} color={COLORS.white} />
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity style={styles.actionButton}>
            <MoreHorizontal size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ReelsScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await API.getAllReels();
      // Add isLiked state to each reel
      const reelsWithState = data.map((reel: any) => ({
        ...reel,
        isLiked: false, // You can implement actual like checking logic later
      }));
      setReels(reelsWithState);
    } catch (err: any) {
      console.error('Error loading reels:', err);
      setError(err?.message || 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (id: number) => {
    setReels((prevReels) =>
      prevReels.map((reel) =>
        reel.id === id
          ? {
              ...reel,
              isLiked: !reel.isLiked,
            }
          : reel
      )
    );
  };

  const handleComment = () => {
    // Mở modal bình luận
    console.log('Open comments');
  };

  const handleShare = async (reel: any) => {
    try {
      Alert.alert(
        'Share Reel',
        `Share this reel?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => console.log('Sharing...') }
        ]
      );
    } catch (err) {
      console.error('Error sharing reel:', err);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReels}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Camera size={80} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Chưa có reel nào</Text>
        <Text style={styles.emptyDescription}>
          Hãy tạo reel đầu tiên của bạn để chia sẻ những khoảnh khắc thú vị!
        </Text>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => {
            router.push('/create-reel');
          }}
        >
          <Text style={styles.createButtonText}>Tạo Reel Ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === currentIndex}
            onLike={() => handleLike(item.id)}
            onComment={handleComment}
            onShare={() => handleShare(item)}
            onFollow={() => {}}
            isMuted={isMuted}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Top header overlay */}
      <View style={styles.topHeaderOverlay}>
        <Text style={styles.reelsTitle}>Reels</Text>
        <TouchableOpacity 
          style={styles.topHeaderButton}
          onPress={() => router.push('/create-reel')}
        >
          <Camera size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Mute toggle */}
      <TouchableOpacity
        style={styles.muteButton}
        onPress={() => setIsMuted(!isMuted)}
      >
        {isMuted ? (
          <VolumeX size={24} color={COLORS.white} />
        ) : (
          <Volume2 size={24} color={COLORS.white} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: RESPONSIVE_SPACING.lg,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  retryButton: {
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: RESPONSIVE_SPACING.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.3,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.5,
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  videoPlayer: {
    flex: 1,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    marginRight: RESPONSIVE_SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  topHeaderOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    zIndex: 10,
  },
  reelsTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  topHeaderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  userSection: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  username: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  followButton: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
  },
  followText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    lineHeight: 20,
  },
  sideActions: {
    position: 'absolute',
    right: RESPONSIVE_SPACING.md,
    bottom: 0,
    gap: RESPONSIVE_SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  muteButton: {
    position: 'absolute',
    top: 120,
    right: RESPONSIVE_SPACING.md,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

