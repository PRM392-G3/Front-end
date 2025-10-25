import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import SimpleVideoUploader from '@/components/SimpleVideoUploader';
import { mediaAPI } from '@/services/mediaAPI';
import { API } from '@/services/api';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CreateReelScreenProps {
  onClose: () => void;
  onReelCreated?: () => void;
}

export default function CreateReelScreen({ onClose, onReelCreated }: CreateReelScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [caption, setCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUploadComplete = async (url: string) => {
    console.log('CreateReelScreen: Video uploaded, URL:', url);
    setIsUploading(true);
    try {
      // URL is already the full URL from the upload
      setVideoUrl(url);
    } catch (error) {
      console.error('CreateReelScreen: Error processing video URL:', error);
      Alert.alert('Lỗi', 'Không thể xử lý video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateReel = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Bạn chưa đăng nhập');
      return;
    }

    if (!videoUrl) {
      Alert.alert('Cảnh báo', 'Vui lòng tải video lên');
      return;
    }

    setIsCreating(true);
    try {
      console.log('CreateReelScreen: Creating reel with:', {
        userId: user.id,
        videoUrl,
        caption: caption.trim(),
      });

      await API.createReel({
        userId: user.id,
        videoUrl,
        caption: caption.trim() || undefined,
        isPublic: true,
      });

      // Reset form
      setCaption('');
      setVideoUrl(null);
      
      onReelCreated?.();
      onClose();
      
      Alert.alert('Thành công', 'Reel đã được tạo');
    } catch (error: any) {
      console.error('CreateReelScreen: Error creating reel:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo reel';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateReel = videoUrl && !isCreating && !isUploading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tạo Reel</Text>
        <TouchableOpacity
          onPress={handleCreateReel}
          disabled={!canCreateReel}
          style={[styles.postButton, !canCreateReel && styles.postButtonDisabled]}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Send size={20} color={canCreateReel ? COLORS.white : COLORS.gray} />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.fullName}</Text>
        </View>

        {/* Caption Input */}
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Viết caption cho reel của bạn..."
          multiline
          textAlignVertical="top"
          maxLength={300}
        />

        {/* Character Count */}
        <Text style={styles.characterCount}>
          {caption.length}/300
        </Text>

        {/* Video Upload Section */}
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>Video Reel</Text>
          
          {videoUrl ? (
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewText}>✓ Video đã được tải lên</Text>
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={() => setVideoUrl(null)}
                disabled={isUploading || isCreating}
              >
                <Text style={styles.removeVideoText}>Xóa video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SimpleVideoUploader
              onUploadComplete={handleVideoUploadComplete}
              folder="reels"
              disabled={isUploading || isCreating}
            />
          )}

          {isUploading && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Đang tải lên video...</Text>
            </View>
          )}
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesSection}>
          <Text style={styles.guidelinesTitle}>Gợi ý:</Text>
          <Text style={styles.guidelineText}>• Video nên có thời lượng từ 15-60 giây</Text>
          <Text style={styles.guidelineText}>• Định dạng video được hỗ trợ: MP4, MOV</Text>
          <Text style={styles.guidelineText}>• Kích thước video tối đa: 100MB</Text>
          <Text style={styles.guidelineText}>• Tỷ lệ khung hình khuyến nghị: 9:16 (dọc)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  captionInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  characterCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  videoSection: {
    marginTop: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  videoPreview: {
    backgroundColor: COLORS.surface,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  videoPreviewText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  removeVideoButton: {
    marginTop: RESPONSIVE_SPACING.xs,
  },
  removeVideoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RESPONSIVE_SPACING.sm,
  },
  uploadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  guidelinesSection: {
    marginTop: RESPONSIVE_SPACING.xl,
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  guidelinesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  guidelineText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE_SPACING.xs,
    lineHeight: 20,
  },
});
