import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Trash2, Save } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import SimpleVideoUploader from '@/components/SimpleVideoUploader';

export default function EditReelScreen() {
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [reelData, setReelData] = useState<any>(null);
  const [newVideoUrl, setNewVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadReelData();
    }
  }, [id]);

  const loadReelData = async () => {
    try {
      setLoading(true);
      const data = await API.getReelById(Number(id));
      setReelData(data);
      setCaption(data.caption || '');
      setIsPublic(data.isPublic);
    } catch (error) {
      console.error('Error loading reel data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin reel');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploadStart = () => {
    setIsUploadingVideo(true);
  };

  const handleVideoUploadComplete = (url: string) => {
    setNewVideoUrl(url);
    setIsUploadingVideo(false);
  };

  const handleVideoUploadError = (error: any) => {
    console.error('Video upload error:', error);
    Alert.alert('Lỗi', 'Không thể tải lên video');
    setIsUploadingVideo(false);
  };

  const handleSave = async () => {
    if (!caption.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả cho reel');
      return;
    }

    try {
      setLoading(true);
      
      const updateData: any = {
        caption: caption.trim(),
        isPublic,
      };

      // Nếu có video mới, thêm vào update data
      if (newVideoUrl) {
        updateData.videoUrl = newVideoUrl;
        updateData.videoFileName = `reel_${Date.now()}.mp4`;
        // Có thể thêm duration nếu cần
        updateData.duration = 30; // Default duration, có thể lấy từ video metadata
      }

      console.log('Updating reel with data:', updateData);
      const result = await API.updateReel(Number(id), updateData);
      console.log('Update result:', result);
      
      Alert.alert('Thành công', 'Reel đã được cập nhật', [
        { 
          text: 'OK', 
          onPress: () => {
            // Thông báo refresh về ReelsScreen
            router.back();
            // Trigger refresh event nếu cần
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('reelUpdated', { detail: { reelId: Number(id) } }));
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error updating reel:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật reel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa Reel',
      'Bạn có chắc chắn muốn xóa reel này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await API.deleteReel(Number(id));
      Alert.alert('Thành công', 'Reel đã được xóa', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error deleting reel:', error);
      Alert.alert('Lỗi', 'Không thể xóa reel');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading && !reelData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa Reel</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Save size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Video Upload Section */}
        <View style={styles.videoSection}>
          <Text style={styles.label}>Video</Text>
          <SimpleVideoUploader
            onUploadComplete={handleVideoUploadComplete}
            onUploadError={handleVideoUploadError}
            onUploadStart={handleVideoUploadStart}
            folder="reels"
            disabled={loading || isUploadingVideo}
          />
          {newVideoUrl && (
            <View style={styles.newVideoInfo}>
              <Text style={styles.newVideoText}>✅ Video mới đã được chọn</Text>
            </View>
          )}
          {reelData?.videoUrl && !newVideoUrl && (
            <View style={styles.currentVideoInfo}>
              <Text style={styles.currentVideoText}>Video hiện tại: {reelData.videoUrl}</Text>
            </View>
          )}
        </View>

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Thêm mô tả cho reel của bạn..."
            placeholderTextColor={COLORS.gray}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{caption.length}/500</Text>
        </View>

        {/* Privacy Setting */}
        <View style={styles.privacySection}>
          <Text style={styles.label}>Quyền riêng tư</Text>
          <View style={styles.privacyOptions}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                isPublic && styles.privacyOptionSelected
              ]}
              onPress={() => setIsPublic(true)}
            >
              <View style={[
                styles.radioButton,
                isPublic && styles.radioButtonSelected
              ]} />
              <Text style={[
                styles.privacyText,
                isPublic && styles.privacyTextSelected
              ]}>
                Công khai
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.privacyOption,
                !isPublic && styles.privacyOptionSelected
              ]}
              onPress={() => setIsPublic(false)}
            >
              <View style={[
                styles.radioButton,
                !isPublic && styles.radioButtonSelected
              ]} />
              <Text style={[
                styles.privacyText,
                !isPublic && styles.privacyTextSelected
              ]}>
                Chỉ mình tôi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading}
        >
          <Trash2 size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Xóa Reel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  content: {
    flex: 1,
    padding: RESPONSIVE_SPACING.md,
  },
  videoSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  newVideoInfo: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    padding: RESPONSIVE_SPACING.sm,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  newVideoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    textAlign: 'center',
  },
  currentVideoInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.sm,
    padding: RESPONSIVE_SPACING.sm,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  currentVideoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  captionInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  characterCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  privacySection: {
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  privacyOptions: {
    gap: RESPONSIVE_SPACING.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: RESPONSIVE_SPACING.md,
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  privacyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  privacyTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
});
