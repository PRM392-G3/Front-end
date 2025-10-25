import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Send, Hash, X, Image as ImageIcon } from 'lucide-react-native';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import SimpleImageUploader from '@/components/SimpleImageUploader';
import SimpleVideoUploader from '@/components/SimpleVideoUploader';
import TagInput from '@/components/TagInput';
import { postAPI, PostResponse, UpdatePostRequest } from '@/services/api';
import { FileUploadResponse } from '@/services/mediaAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditPostScreen() {
  const { post: postParam } = useLocalSearchParams();
  const router = useRouter();
  
  // State for post data and loading
  const [originalPost, setOriginalPost] = useState<PostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse post data safely in useEffect
  useEffect(() => {
    try {
      if (!postParam) {
        setParseError('Không có dữ liệu bài viết');
        setIsLoading(false);
        return;
      }

      const parsedPost = JSON.parse(postParam as string) as PostResponse;
      setOriginalPost(parsedPost);
      setParseError(null);
    } catch (error) {
      console.error('Error parsing post data:', error);
      setParseError('Không thể tải dữ liệu bài viết');
    } finally {
      setIsLoading(false);
    }
  }, [postParam]);

  // Initialize form data when originalPost is loaded
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (originalPost) {
      console.log('EditPostScreen: Initializing form with post data:', originalPost);
      
      setContent(typeof originalPost.content === 'string' ? originalPost.content : '');
      setImageUrl(
        typeof originalPost.imageUrl === 'string' && originalPost.imageUrl
          ? originalPost.imageUrl
          : null
      );
      setVideoUrl(
        typeof originalPost.videoUrl === 'string' && originalPost.videoUrl
          ? originalPost.videoUrl
          : null
      );
      setTags(
        Array.isArray(originalPost.tags)
          ? originalPost.tags
              .filter(tag => tag && typeof tag.name === 'string')
              .map(tag => tag.name)
          : []
      );
    }
  }, [originalPost]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  // Media type: 'image' | 'video' | null
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  useEffect(() => {
    if (originalPost) {
      const newMediaType = originalPost.imageUrl ? 'image' : originalPost.videoUrl ? 'video' : null;
      setMediaType(newMediaType);
      console.log('EditPostScreen: Media type set to:', newMediaType);
    }
  }, [originalPost]);
  
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Debug: Log loaded data
  useEffect(() => {
    console.log('EditPostScreen: Initial data loaded:');
    console.log('- Content:', content);
    console.log('- Image URL:', imageUrl);
    console.log('- Video URL:', videoUrl);
    console.log('- Tags:', tags);
    console.log('- Media Type:', mediaType);
  }, []);

  const handleImageUploadStart = () => {
    console.log('EditPostScreen: Image upload started...');
    setIsUploadingImage(true);
  };

  const handleImageUploadComplete = (result: any) => {
    console.log('EditPostScreen: Image upload complete:', result);
    setImageUrl(result.publicUrl);
    setVideoUrl(null); // Clear video if image is uploaded
    setMediaType('image');
    setIsUploadingImage(false);
  };

  const handleVideoUploadComplete = (url: string) => {
    console.log('EditPostScreen: Video upload complete:', url);
    setVideoUrl(url);
    setImageUrl(null); // Clear image if video is uploaded
    setMediaType('video');
    setIsUploadingVideo(false);
  };

  const handleImageUploadError = (error: any) => {
    console.error('EditPostScreen: Image upload error:', error);
    setIsUploadingImage(false);
    Alert.alert('Lỗi', 'Không thể tải lên ảnh. Vui lòng thử lại.');
  };


  const handleUpdatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không xác định được người dùng.');
      return;
    }

    try {
      setIsUpdating(true);

      const updateData: UpdatePostRequest = {
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      const updatedPost = await postAPI.updatePost(originalPost!.id, updateData);
      
      Alert.alert('Thành công', 'Bài viết đã được cập nhật thành công!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to post detail
            router.back();
          }
        }
      ]);
      
    } catch (error: any) {
      console.error('Error updating post:', error);
      
      let errorMessage = 'Không thể cập nhật bài viết. Vui lòng thử lại.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền chỉnh sửa bài viết này.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy bài viết.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    if (!originalPost) {
      router.back();
      return;
    }

    if (content !== originalPost.content || imageUrl !== originalPost.imageUrl || 
        videoUrl !== originalPost.videoUrl ||
        JSON.stringify(tags) !== JSON.stringify(originalPost.tags || [])) {
      Alert.alert(
        'Thoát',
        'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const removeVideo = () => {
    setVideoUrl(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu bài viết...</Text>
      </View>
    );
  }

  // Show error state
  if (parseError || !originalPost) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{parseError || 'Không thể tải dữ liệu bài viết'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!content.trim() || isUpdating) && styles.saveButtonDisabled]}
          onPress={handleUpdatePost}
          disabled={!content.trim() || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Send size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Lưu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Nội dung bài viết</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={COLORS.gray}
            multiline
            maxLength={2000}
          />
          <Text style={styles.characterCount}>
            {content.length}/2000
          </Text>
        </View>

        {/* Current Image Section */}
        {imageUrl && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Ảnh hiện tại</Text>
            <View style={styles.currentImageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.currentImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <X size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Video Section */}
        {videoUrl && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>Video hiện tại</Text>
            <View style={styles.currentVideoContainer}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>📹 Video đã tải lên</Text>
                <Text style={styles.videoUrlText} numberOfLines={1}>
                  {videoUrl}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={removeVideo}
              >
                <X size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>
            {imageUrl ? 'Thay đổi ảnh' : 'Thêm ảnh'}
          </Text>
          <SimpleImageUploader
            folder="posts"
            onUploadStart={handleImageUploadStart}
            onUploadComplete={handleImageUploadComplete}
            onUploadError={handleImageUploadError}
            disabled={isUpdating || mediaType === 'video'}
          />
          {isUploadingImage && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Đang tải lên ảnh...</Text>
            </View>
          )}
          {mediaType === 'video' && (
            <Text style={styles.disabledText}>Không thể upload ảnh khi đã có video</Text>
          )}
        </View>

        {/* Video Upload Section */}
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>
            {videoUrl ? 'Thay đổi video' : 'Thêm video'}
          </Text>
          <SimpleVideoUploader
            folder="posts"
            disabled={isUpdating || mediaType === 'image'}
            onUploadComplete={handleVideoUploadComplete}
            onUploadError={(error: any) => {
              console.error('EditPostScreen: Video upload error:', error);
              setIsUploadingVideo(false);
            }}
          />
          {isUploadingVideo && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Đang tải lên video...</Text>
            </View>
          )}
          {mediaType === 'image' && (
            <Text style={styles.disabledText}>Không thể upload video khi đã có ảnh</Text>
          )}
        </View>

        {/* Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Thẻ hashtag</Text>
          <TagInput
            selectedTags={tags}
            onTagsChange={setTags}
            placeholder="Thêm hashtag..."
            maxTags={10}
            disabled={isUpdating}
          />
        </View>

        {/* Original Post Info */}
        <View style={styles.originalInfoSection}>
          <Text style={styles.sectionTitle}>Thông tin gốc</Text>
          <View style={styles.originalInfo}>
            <Text style={styles.originalInfoText}>
              Tạo lúc: {new Date(originalPost.createdAt).toLocaleString('vi-VN')}
            </Text>
            <Text style={styles.originalInfoText}>
              Cập nhật lần cuối: {new Date(originalPost.updatedAt).toLocaleString('vi-VN')}
            </Text>
            <Text style={styles.originalInfoText}>
              Lượt thích: {originalPost.likeCount}
            </Text>
            <Text style={styles.originalInfoText}>
              Bình luận: {originalPost.commentCount}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    height: 50,
  },
  backButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  contentInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  imageSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  videoSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  currentImageContainer: {
    position: 'relative',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  currentImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: RESPONSIVE_SPACING.xs,
    right: RESPONSIVE_SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentVideoContainer: {
    position: 'relative',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  videoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    padding: RESPONSIVE_SPACING.sm,
  },
  videoPlaceholderText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  videoUrlText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
  },
  removeVideoButton: {
    position: 'absolute',
    top: RESPONSIVE_SPACING.xs,
    right: RESPONSIVE_SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingIndicator: {
    marginTop: RESPONSIVE_SPACING.sm,
    padding: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  tagsSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  originalInfoSection: {
    padding: RESPONSIVE_SPACING.md,
  },
  originalInfo: {
    backgroundColor: COLORS.lightGray,
    padding: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  originalInfoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  disabledText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
