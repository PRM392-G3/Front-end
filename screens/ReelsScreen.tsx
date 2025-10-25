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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  X,
  Send,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { API, commentAPI } from '@/services/api';
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

// Comment Modal Component
const CommentModal = ({ 
  visible, 
  onClose, 
  reel, 
  onCommentSent 
}: { 
  visible: boolean; 
  onClose: () => void;
  reel: any;
  onCommentSent: () => void;
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (visible && reel?.id) {
      loadComments();
    }
  }, [visible, reel?.id]);

  const loadComments = async () => {
    try {
      const data = await commentAPI.getCommentsByReel(reel.id);
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;
    
    setLoading(true);
    try {
      await commentAPI.createComment({
        reelId: reel.id,
        userId: user.id,
        content: commentText.trim(),
      });
      setCommentText('');
      loadComments();
      onCommentSent();
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Lỗi', 'Không thể gửi bình luận');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bình luận</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView style={styles.commentsList}>
            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>Chưa có bình luận nào</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.user?.avatarUrl || 'https://via.placeholder.com/40' }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>{comment.user?.fullName || 'Unknown'}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Thêm bình luận..."
              placeholderTextColor={COLORS.gray}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentText.trim() || loading}
              style={[styles.sendButton, (!commentText.trim() || loading) && styles.sendButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Send size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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

                     {/* More */}
           <TouchableOpacity style={styles.actionButton} onPress={onShare}>
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
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadReels();
    
    // Lắng nghe sự kiện refresh khi reel được update
    const handleReelUpdated = (event: any) => {
      console.log('Reel updated, refreshing reels...', event.detail);
      refreshReels();
    };

    // Add event listener for reel updates
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('reelUpdated', handleReelUpdated);
    }

    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('reelUpdated', handleReelUpdated);
      }
    };
  }, []);

  // Alternative: Sử dụng useFocusEffect để refresh khi quay lại màn hình
  useFocusEffect(
    React.useCallback(() => {
      // Refresh reels khi focus vào màn hình
      console.log('ReelsScreen focused, checking for updates...');
      refreshReels();
    }, [])
  );

  const loadReels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await API.getAllReels();
      
      // Backend now handles privacy filtering, so we can use the data directly
      setReels(data);
    } catch (err: any) {
      console.error('Error loading reels:', err);
      setError(err?.message || 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const refreshReels = async () => {
    console.log('Manually refreshing reels...');
    await loadReels();
  };

  const handleLike = async (reel: any) => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để thích reel');
      return;
    }

    try {
      const newIsLiked = !reel.isLiked;
      
      // Optimistic update
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.id === reel.id
            ? {
                ...r,
                isLiked: newIsLiked,
                likeCount: newIsLiked ? r.likeCount + 1 : Math.max(0, r.likeCount - 1),
              }
            : r
        )
      );

      // Call API
      if (newIsLiked) {
        await API.likeReel(reel.id, user.id);
      } else {
        await API.unlikeReel(reel.id, user.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setReels((prevReels) =>
        prevReels.map((r) =>
          r.id === reel.id ? reel : r
        )
      );
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    }
  };

  const handleComment = (reel: any) => {
    setSelectedReel(reel);
    setShowCommentModal(true);
  };

  const handleCommentSent = () => {
    // Refresh reels to update comment count
    loadReels();
  };

  const handleShare = async (reel: any) => {
    try {
      // Check if this is the user's reel
      const isOwnReel = user && reel.userId === user.id;
      
      if (isOwnReel) {
        // Show edit/delete options
        Alert.alert(
          'Tùy chọn Reel',
          'Chọn một tùy chọn',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Chỉnh sửa', 
              onPress: () => handleEditReel(reel)
            },
            { 
              text: 'Xóa', 
              style: 'destructive',
              onPress: () => handleDeleteReel(reel)
            }
          ]
        );
      } else {
        // Show share options for other users' reels
        Alert.alert(
          'Chia sẻ Reel',
          'Bạn có muốn chia sẻ reel này?',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chia sẻ', onPress: () => console.log('Sharing...') }
          ]
        );
      }
    } catch (err) {
      console.error('Error handling share/options:', err);
    }
  };

  const handleEditReel = (reel: any) => {
    router.push(`/edit-reel?id=${reel.id}` as any);
  };

  const handleDeleteReel = async (reel: any) => {
    try {
      Alert.alert(
        'Xóa Reel',
        'Bạn có chắc chắn muốn xóa reel này? Hành động này không thể hoàn tác.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                await API.deleteReel(reel.id);
                // Refresh reels after deletion
                loadReels();
                Alert.alert('Thành công', 'Reel đã được xóa');
              } catch (error) {
                console.error('Error deleting reel:', error);
                Alert.alert('Lỗi', 'Không thể xóa reel');
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error in handleDeleteReel:', err);
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
            onLike={() => handleLike(item)}
            onComment={() => handleComment(item)}
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

      {/* Comment Modal */}
      {selectedReel && (
        <CommentModal
          visible={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedReel(null);
          }}
          reel={selectedReel}
          onCommentSent={handleCommentSent}
        />
      )}
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
  // Comment Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  commentsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    padding: RESPONSIVE_SPACING.md,
  },
  emptyComments: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentContent: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  commentAuthor: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  commentText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.sm,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
});

