import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Send, Image as ImageIcon, Hash } from 'lucide-react-native';
import ImageUploader from '@/components/ImageUploader';
import SimpleImageUploader from '@/components/SimpleImageUploader';
import TagInput from '@/components/TagInput';
import { postAPI, CreatePostRequest } from '@/services/api';
import { mediaAPI, FileUploadResponse } from '@/services/mediaAPI';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostScreenProps {
  navigation?: any;
  onPostCreated?: (post: any) => void;
}

export default function CreatePostScreen({ navigation, onPostCreated }: CreatePostScreenProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleImageUploadStart = () => {
    console.log('CreatePostScreen: Image upload started...');
    setIsUploadingImage(true);
  };

  const handleImageUploadComplete = (result: FileUploadResponse) => {
    console.log('CreatePostScreen: Image upload complete:', result);
    setImageUrl(result.publicUrl);
    setIsUploadingImage(false);
  };

  const handleImageUploadError = (error: any) => {
    console.error('CreatePostScreen: Image upload error:', error);
    setIsUploadingImage(false);
    Alert.alert('Lỗi', 'Không thể tải lên ảnh. Vui lòng thử lại.');
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không xác định được người dùng.');
      return;
    }

    try {
      setIsCreating(true);

      const postData: CreatePostRequest = {
        userId: user.id,
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      console.log('CreatePostScreen: Creating post with data:', postData);
      console.log('CreatePostScreen: User ID:', user.id);
      console.log('CreatePostScreen: Content length:', content.trim().length);
      console.log('CreatePostScreen: Image URL:', imageUrl);
      console.log('CreatePostScreen: Tags count:', tags.length);
      
      const newPost = await postAPI.createPost(postData);
      
      console.log('CreatePostScreen: Post created successfully:', newPost);
      
      // Reset form
      setContent('');
      setImageUrl(null);
      setTags([]);
      
      Alert.alert('Thành công', 'Bài viết đã được tạo thành công!', [
        {
          text: 'OK',
          onPress: () => {
            // Callback to parent component
            onPostCreated?.(newPost);
            
            // Navigate back to HomePage
            navigation?.goBack();
          }
        }
      ]);
      
    } catch (error: any) {
      console.error('CreatePostScreen: Error creating post:', error);
      console.error('CreatePostScreen: Error response:', error.response?.data);
      console.error('CreatePostScreen: Error status:', error.response?.status);
      console.error('CreatePostScreen: Error message:', error.message);
      
      let errorMessage = 'Không thể tạo bài viết. Vui lòng thử lại.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (content.trim() || imageUrl) {
      Alert.alert(
        'Xác nhận',
        'Bạn có chắc chắn muốn hủy? Nội dung chưa lưu sẽ bị mất.',
        [
          { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
          { text: 'Hủy', style: 'destructive', onPress: () => navigation?.goBack() }
        ]
      );
    } else {
      navigation?.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() || isCreating) && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={!content.trim() || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Send size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <ImageIcon size={24} color={COLORS.primary} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Text style={styles.privacyText}>
                {isPublic ? 'Công khai' : 'Chỉ bạn bè'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Input */}
        <View style={styles.contentInputContainer}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Bạn đang nghĩ gì?"
            placeholderTextColor={COLORS.gray}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.characterCount}>
            {content.length}/2000
          </Text>
        </View>

        {/* Image Upload */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Thêm ảnh</Text>
          <SimpleImageUploader
            folder="posts"
            onUploadStart={handleImageUploadStart}
            onUploadComplete={handleImageUploadComplete}
            onUploadError={handleImageUploadError}
            disabled={isCreating}
          />
          {imageUrl && (
            <View style={styles.imagePreview}>
              <Text style={styles.imagePreviewText}>✓ Ảnh đã được tải lên</Text>
            </View>
          )}
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
            disabled={isCreating}
          />
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
    fontWeight: '700',
    color: COLORS.black,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  postButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray,
  },
  userDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  privacyButton: {
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  privacyText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  contentInputContainer: {
    paddingVertical: RESPONSIVE_SPACING.md,
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
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  imagePreview: {
    marginTop: RESPONSIVE_SPACING.sm,
    padding: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.success + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  imagePreviewText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
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
    paddingVertical: RESPONSIVE_SPACING.md,
  },
});