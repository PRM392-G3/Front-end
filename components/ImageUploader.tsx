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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: selectedImages.length < maxImages,
      });

      if (!result.canceled) {
        const newImages = Array.isArray(result.assets) ? result.assets : [result.assets];
        setSelectedImages(prev => [...prev, ...newImages].slice(0, maxImages));
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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, result.assets[0]].slice(0, maxImages));
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
    if (selectedImages.length === 0 || !token) return;

    setUploading(true);
    const uploadResults: FileUploadResponse[] = [];

    try {
      for (const image of selectedImages) {
        const result = await mediaAPI.uploadFile(image, folder, token) as FileUploadResponse;
        uploadResults.push(result);
      }

      setSelectedImages([]);
      onUploadComplete?.(uploadResults[0]); // Return first result for single image
      
      Alert.alert('Success', `${uploadResults.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error);
      Alert.alert('Upload Failed', 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
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
        {selectedImages.length < maxImages && (
          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={showImageOptions}
            disabled={disabled || uploading}
          >
            <ImageIcon size={20} color={COLORS.primary} />
            <Text style={styles.buttonText}>
              {selectedImages.length === 0 ? 'Add Image' : 'Add More'}
            </Text>
          </TouchableOpacity>
        )}

        {selectedImages.length > 0 && (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadImages}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : `Upload ${selectedImages.length} Image(s)`}
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
