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
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Send, Hash, X, Image as ImageIcon } from 'lucide-react-native';
import SimpleImageUploader from '@/components/SimpleImageUploader';
import TagInput from '@/components/TagInput';
import { postAPI, PostResponse, UpdatePostRequest, FileUploadResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditPostScreen() {
  const { post: postParam } = useLocalSearchParams();
  const router = useRouter();
  
  const originalPost = JSON.parse(postParam as string) as PostResponse;
  
  const [content, setContent] = useState(originalPost.content);
  const [imageUrl, setImageUrl] = useState<string | null>(originalPost.imageUrl);
  const [tags, setTags] = useState<string[]>(
    originalPost.tags ? originalPost.tags.map(tag => tag.name) : []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleImageUploadStart = () => {
    console.log('EditPostScreen: Image upload started...');
    setIsUploadingImage(true);
  };

  const handleImageUploadComplete = (result: FileUploadResponse) => {
    console.log('EditPostScreen: Image upload complete:', result);
    setImageUrl(result.publicUrl);
    setIsUploadingImage(false);
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
        tags: tags.length > 0 ? tags : undefined,
      };

      console.log('EditPostScreen: Updating post with data:', updateData);
      console.log('EditPostScreen: Post ID:', originalPost.id);
      console.log('EditPostScreen: User ID:', user.id);
      console.log('EditPostScreen: Content length:', content.trim().length);
      console.log('EditPostScreen: Image URL:', imageUrl);
      console.log('EditPostScreen: Tags count:', tags.length);
      
      const updatedPost = await postAPI.updatePost(originalPost.id, updateData);
      
      console.log('EditPostScreen: Post updated successfully:', updatedPost);
      
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
      console.error('EditPostScreen: Error updating post:', error);
      console.error('EditPostScreen: Error response:', error.response?.data);
      console.error('EditPostScreen: Error status:', error.response?.status);
      console.error('EditPostScreen: Error message:', error.message);
      
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
    if (content !== originalPost.content || imageUrl !== originalPost.imageUrl || 
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
            disabled={isUpdating}
          />
          {isUploadingImage && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Đang tải lên ảnh...</Text>
            </View>
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
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
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
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  contentInput: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  imageSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  tagsSection: {
    padding: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
});
