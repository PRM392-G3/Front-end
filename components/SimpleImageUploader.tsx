import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Image as ImageIcon, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Manual configuration
const API_CONFIG = {
  BASE_URL: 'https://bobby-unpargeted-nicole.ngrok-free.dev/api',
  TIMEOUT: 30000,
  MEDIA_TIMEOUT: 60000,
};

interface FileUploadResponse {
  fileName: string;
  filePath: string;
  publicUrl: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  userId: string;
  fileType: string;
}

interface SimpleImageUploaderProps {
  onUploadComplete?: (result: FileUploadResponse) => void;
  onUploadError?: (error: any) => void;
  onUploadStart?: () => void;
  folder?: string;
  disabled?: boolean;
}

export default function SimpleImageUploader({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  folder = 'posts',
  disabled = false,
}: SimpleImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để upload ảnh');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (disabled) return;
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: 'image/jpeg',
          fileName: asset.fileName || 'image.jpg',
          fileSize: asset.fileSize,
        });
        console.log('SimpleImageUploader: Image selected:', asset);
      }
    } catch (error) {
      console.error('SimpleImageUploader: Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    if (disabled) return;
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: 'image/jpeg',
          fileName: asset.fileName || 'photo.jpg',
          fileSize: asset.fileSize,
        });
        console.log('SimpleImageUploader: Photo taken:', asset);
      }
    } catch (error) {
      console.error('SimpleImageUploader: Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh trước');
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      console.log('SimpleImageUploader: Starting upload with fetch...');
      console.log('SimpleImageUploader: Selected image:', selectedImage);
      console.log('SimpleImageUploader: Target folder:', folder);
      console.log('SimpleImageUploader: API Base URL:', API_CONFIG.BASE_URL);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Không có token để upload. Vui lòng đăng nhập lại.');
      }

      console.log('SimpleImageUploader: Token length:', token.length);

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        type: selectedImage.type,
        name: selectedImage.fileName,
      } as any);

      console.log('SimpleImageUploader: Sending upload request with fetch...');
      console.log('SimpleImageUploader: Upload URL:', `${API_CONFIG.BASE_URL}/blob-storage/media/upload?folder=${folder}`);
      
      // Use fetch instead of axios
      const response = await fetch(`${API_CONFIG.BASE_URL}/blob-storage/media/upload?folder=${folder}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      console.log('SimpleImageUploader: Fetch response status:', response.status);
      console.log('SimpleImageUploader: Fetch response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SimpleImageUploader: Upload failed with status:', response.status);
        console.error('SimpleImageUploader: Error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('SimpleImageUploader: Upload successful:', result);
      
      // Verify the response has the required fields
      if (!result.publicUrl) {
        throw new Error('Upload thành công nhưng không có URL ảnh');
      }

      console.log('SimpleImageUploader: Image uploaded successfully, URL:', result.publicUrl);
      
      // Clear selected image
      setSelectedImage(null);
      
      // Call success callback
      onUploadComplete?.(result);
      
      Alert.alert('Thành công', 'Ảnh đã được tải lên thành công!');
      
    } catch (error: any) {
      console.error('SimpleImageUploader: Upload error:', error);
      onUploadError?.(error);
      Alert.alert('Tải lên thất bại', 'Không thể tải lên ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const showImageOptions = () => {
    if (disabled) return;
    
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
      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
            disabled={isUploading}
          >
            <X size={16} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.imageInfo}>
            {selectedImage.fileName} ({selectedImage.fileSize ? `${Math.round(selectedImage.fileSize / 1024)}KB` : 'Unknown size'})
          </Text>
        </View>
      )}

      {/* Upload Button */}
      {selectedImage && (
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={uploadImage}
          disabled={isUploading || disabled}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Đang tải lên...</Text>
            </>
          ) : (
            <>
              <Upload size={20} color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Tải lên ảnh</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Select Image Button */}
      {!selectedImage && (
        <TouchableOpacity
          style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
          onPress={showImageOptions}
          disabled={disabled}
        >
          <ImageIcon size={24} color={COLORS.primary} />
          <Text style={styles.selectButtonText}>Chọn ảnh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  removeButton: {
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
  imageInfo: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: RESPONSIVE_SPACING.lg,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  selectButtonDisabled: {
    borderColor: COLORS.gray,
    opacity: 0.6,
  },
  selectButtonText: {
    color: COLORS.primary,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
});
