import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { mediaAPI, FileUploadResponse, testToken } from '@/services/mediaAPI';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploaderProps {
  onUploadComplete?: (result: FileUploadResponse) => void;
  onUploadError?: (error: any) => void;
  folder?: string;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  folder = 'posts',
  maxImages = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (disabled || uploading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // Luôn cho phép edit
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false, // Chỉ cho phép chọn 1 ảnh
      });

      if (!result.canceled) {
        const newImage = result.assets[0];
        // Thay thế ảnh cũ bằng ảnh mới
        setSelectedImages([newImage]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      onUploadError?.(error);
    }
  };

  const takePhoto = async () => {
    if (disabled || uploading) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Thay thế ảnh cũ bằng ảnh mới
        setSelectedImages([result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      onUploadError?.(error);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return;

    setUploading(true);
    const uploadResults: FileUploadResponse[] = [];

    try {
      // Test token trước khi upload
      console.log('ImageUploader: Testing token before upload...');
      await testToken();
      
      for (const image of selectedImages) {
        // Token sẽ được thêm tự động bởi request interceptor
        const result = await mediaAPI.uploadFile(image, folder);
        uploadResults.push(result);
      }

      setSelectedImages([]);
      onUploadComplete?.(uploadResults[0]); // Return first result for single image
      
      Alert.alert('Thành công', 'Ảnh đã được tải lên thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error);
      Alert.alert('Tải lên thất bại', 'Không thể tải lên ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Chọn ảnh',
      'Chọn cách bạn muốn thêm ảnh',
      [
        { text: 'Máy ảnh', onPress: takePhoto },
        { text: 'Thư viện ảnh', onPress: pickImage },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <View style={styles.imageGrid}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                disabled={uploading}
              >
                <X size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={showImageOptions}
          disabled={disabled || uploading}
        >
          <ImageIcon size={20} color={COLORS.primary} />
          <Text style={styles.buttonText}>
            {selectedImages.length === 0 ? 'Chọn ảnh' : 'Thay đổi ảnh'}
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadImages}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: RESPONSIVE_SPACING.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.sm,
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    gap: RESPONSIVE_SPACING.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
  },
});
