import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES, SAFE_AREA } from '@/constants/theme';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageUploader from '@/components/ImageUploader';
import { PostResponse, postAPI } from '@/services/api';
import { FileUploadResponse } from '@/services/mediaAPI';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostScreenProps {
  onPostCreated?: (post: PostResponse) => void;
  onClose?: () => void;
}

export default function CreatePostScreen({ onPostCreated, onClose }: CreatePostScreenProps) {
  const [content, setContent] = useState('');
  const [uploadedImage, setUploadedImage] = useState<FileUploadResponse | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleImageUpload = (result: FileUploadResponse) => {
    setUploadedImage(result);
    console.log('Image uploaded:', result);
  };

  const handleImageUploadError = (error: any) => {
    console.error('Image upload error:', error);
    Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !uploadedImage) {
      Alert.alert('Empty Post', 'Please add some content or an image to your post.');
      return;
    }

    setIsPosting(true);
    
    try {
      // TODO: Implement actual post creation API
      console.log('Creating post:', {
        content: content.trim(),
        imageUrl: uploadedImage?.publicUrl,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => {
          setContent('');
          setUploadedImage(null);
          // Navigate back or refresh feed
        }}
      ]);
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        <TouchableOpacity 
          style={[styles.postButton, (!content.trim() && !uploadedImage) && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={isPosting || (!content.trim() && !uploadedImage)}
        >
          <Send size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Nguyễn Văn A</Text>
            <Text style={styles.userStatus}>Đang chia sẻ...</Text>
          </View>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Bạn đang nghĩ gì?"
          placeholderTextColor={COLORS.gray}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Image Upload */}
        <ImageUploader
          onUploadComplete={handleImageUpload}
          onUploadError={handleImageUploadError}
          folder="posts"
          maxImages={1}
          disabled={isPosting}
        />

        {/* Uploaded Image Preview */}
        {uploadedImage && (
          <View style={styles.uploadedImageContainer}>
            <Text style={styles.uploadedImageText}>✅ Image uploaded successfully</Text>
            <Text style={styles.uploadedImageUrl}>{uploadedImage.fileName}</Text>
          </View>
        )}

        {/* Posting Status */}
        {isPosting && (
          <View style={styles.postingStatus}>
            <Text style={styles.postingText}>Đang tạo bài viết...</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginRight: RESPONSIVE_SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  userStatus: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  contentInput: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
    minHeight: 120,
    paddingVertical: RESPONSIVE_SPACING.md,
    textAlignVertical: 'top',
  },
  uploadedImageContainer: {
    backgroundColor: COLORS.primaryLight,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: RESPONSIVE_SPACING.sm,
  },
  uploadedImageText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  uploadedImageUrl: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.xs,
  },
  postingStatus: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.lg,
  },
  postingText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
  },
});