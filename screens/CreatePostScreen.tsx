import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { X, Send } from 'lucide-react-native';
import { PostResponse, postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import TagInput from '@/components/TagInput';

interface CreatePostScreenProps {
  onClose: () => void;
  onPostCreated?: (post: PostResponse) => void;
}

export default function CreatePostScreen({ onClose, onPostCreated }: CreatePostScreenProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePost = async () => {
    if (!user || !content.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const postData = {
        userId: user.id,
        content: content.trim(),
        imageUrl: selectedImages[0],
        videoUrl: selectedVideo,
        tags: selectedTags,
      };

      const newPost = await postAPI.createPost(postData);
      
      // Reset form
      setContent('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setSelectedTags([]);
      
      onPostCreated?.(newPost);
      onClose();
      
      Alert.alert('Thành công', 'Bài viết đã được tạo');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Lỗi', 'Không thể tạo bài viết');
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageUpload = (result: any) => {
    setSelectedImages([result.publicUrl]);
  };

  const handleVideoUpload = (result: any) => {
    setSelectedVideo(result.publicUrl);
  };

  const canCreatePost = content.trim().length > 0 && !isCreating;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          disabled={!canCreatePost}
        >
          <Text style={[
            styles.postButton,
            !canCreatePost && styles.postButtonDisabled
          ]}>
            {isCreating ? 'Đang tạo...' : 'Đăng'}
          </Text>
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

        {/* Post Content */}
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Bạn đang nghĩ gì?"
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        {/* Character Count */}
        <Text style={styles.characterCount}>
          {content.length}/2000
        </Text>

        {/* Media Upload */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Thêm phương tiện</Text>
          
          <ImageUploader
            onUploadComplete={handleImageUpload}
            folder="posts"
            maxImages={1}
          />

          <VideoUploader
            onUploadComplete={handleVideoUpload}
            folder="posts"
            maxVideos={1}
          />
        </View>

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Thêm hashtag</Text>
          <TagInput
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            placeholder="Thêm hashtag..."
            maxTags={5}
          />
        </View>

        {/* Preview */}
        {(selectedImages.length > 0 || selectedVideo) && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Xem trước</Text>
            {selectedImages.length > 0 && (
              <Image source={{ uri: selectedImages[0] }} style={styles.previewImage} />
            )}
            {selectedVideo && (
              <View style={styles.previewVideo}>
                <Text style={styles.previewVideoText}>Video đã chọn</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  postButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent.primary,
    fontWeight: '600',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
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
  contentInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  mediaSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  tagsSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  previewSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  previewVideo: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
});