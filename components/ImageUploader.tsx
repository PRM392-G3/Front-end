import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { mediaAPI, FileUploadResponse } from '@/services/mediaAPI';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploaderProps {
  onUploadComplete?: (result: FileUploadResponse) => void;
  onUploadError?: (error: any) => void;
  onUploadStart?: () => void;
  folder?: string;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  folder = 'posts',
  maxImages = 5,
  disabled = false,
}: ImageUploaderProps) {
  const { user } = useAuth();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const pickImage = async () => {
    if (disabled || uploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        const totalImages = selectedImages.length + newImages.length;
        
        if (totalImages > maxImages) {
          Alert.alert('Lỗi', `Chỉ có thể chọn tối đa ${maxImages} ảnh`);
          return;
        }

        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const removeImage = (index: number) => {
    if (disabled || uploading) return;
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const uploadImages = async () => {
    if (!user || selectedImages.length === 0 || uploading) return;

    setUploading(true);
    onUploadStart?.();

    try {
      const uploadPromises = selectedImages.map(async (imageUri, index) => {
        try {
          setUploadProgress(prev => ({ ...prev, [index]: 0 }));

          const response = await mediaAPI.uploadImage(imageUri, folder, (progress) => {
            setUploadProgress(prev => ({ ...prev, [index]: progress }));
          });

          setUploadProgress(prev => ({ ...prev, [index]: 100 }));
          return response;
        } catch (error) {
          console.error(`Error uploading image ${index}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Clear selected images after successful upload
      setSelectedImages([]);
      setUploadProgress({});
      
      // Call completion callback with all results
      results.forEach(result => {
        onUploadComplete?.(result);
      });

      Alert.alert('Thành công', `Đã tải lên ${results.length} ảnh`);
    } catch (error) {
      console.error('Error uploading images:', error);
      onUploadError?.(error);
      Alert.alert('Lỗi', 'Không thể tải lên ảnh');
    } finally {
      setUploading(false);
    }
  };

  const getProgressForImage = (index: number) => {
    return uploadProgress[index] || 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageGrid}>
        {selectedImages.map((imageUri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            
            {!disabled && !uploading && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <X size={16} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
            
            {uploading && (
              <View style={styles.progressOverlay}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getProgressForImage(index)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgressForImage(index))}%
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {selectedImages.length < maxImages && !uploading && (
          <TouchableOpacity
            style={[styles.addButton, disabled && styles.addButtonDisabled]}
            onPress={pickImage}
            disabled={disabled}
          >
            <ImageIcon size={24} color={COLORS.text.secondary} />
            <Text style={styles.addButtonText}>Thêm ảnh</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedImages.length > 0 && !uploading && (
        <TouchableOpacity
          style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
          onPress={uploadImages}
          disabled={disabled}
        >
          <Text style={styles.uploadButtonText}>
            Tải lên {selectedImages.length} ảnh
          </Text>
        </TouchableOpacity>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <Text style={styles.uploadingText}>
            Đang tải lên {selectedImages.length} ảnh...
          </Text>
        </View>
      )}
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
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.border.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.sm,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: COLORS.text.primary,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
  },
  uploadingContainer: {
    paddingVertical: RESPONSIVE_SPACING.sm,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: RESPONSIVE_SPACING.xs,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
  },
  progressText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.text.primary,
    marginTop: RESPONSIVE_SPACING.xs,
  },
});