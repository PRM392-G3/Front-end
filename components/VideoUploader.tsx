import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { mediaAPI, FileUploadResponse } from '../services/mediaAPI';
import { COLORS } from '../constants/theme';

interface VideoUploaderProps {
  onUploadComplete?: (result: FileUploadResponse) => void;
  onUploadError?: (error: any) => void;
  onUploadStart?: () => void;
  folder?: string;
  maxVideos?: number;
  disabled?: boolean;
}

export default function VideoUploader({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  folder = 'posts',
  maxVideos = 1,
  disabled = false,
}: VideoUploaderProps) {
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload videos.');
      return false;
    }
    return true;
  };

  const pickVideo = async () => {
    if (disabled || uploading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
        videoMaxDuration: 60, // Giới hạn 60 giây
      });

      if (!result.canceled) {
        const newVideo = result.assets[0];
        setSelectedVideos([newVideo]);
      }
    } catch (error) {
      console.error('Video picker error:', error);
      onUploadError?.(error);
    }
  };

  const takeVideo = async () => {
    if (disabled || uploading) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to record videos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 60, // Giới hạn 60 giây
      });

      if (!result.canceled) {
        const newVideo = result.assets[0];
        setSelectedVideos([newVideo]);
      }
    } catch (error) {
      console.error('Camera video error:', error);
      Alert.alert('Lỗi', 'Không thể quay video');
    }
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadVideos = async () => {
    if (selectedVideos.length === 0) return;

    setUploading(true);
    onUploadStart?.();
    const uploadResults: FileUploadResponse[] = [];

    try {
      console.log('VideoUploader: Starting upload process...');
      console.log('VideoUploader: Selected videos count:', selectedVideos.length);
      console.log('VideoUploader: Target folder:', folder);
      
      for (const video of selectedVideos) {
        console.log('VideoUploader: Uploading video:', {
          uri: video.uri,
          type: video.type,
          fileName: video.fileName,
          size: video.fileSize || 'unknown',
          duration: video.duration || 'unknown'
        });
        
        const result = await mediaAPI.uploadFile(video, folder);
        console.log('VideoUploader: Upload result:', result);
        
        if (!result.publicUrl) {
          throw new Error('Upload thành công nhưng không có URL video');
        }
        
        uploadResults.push(result);
        console.log('VideoUploader: Video uploaded successfully, URL:', result.publicUrl);
      }

      setSelectedVideos([]);
      
      const firstResult = uploadResults[0];
      console.log('VideoUploader: Calling onUploadComplete with result:', firstResult);
      onUploadComplete?.(firstResult);
      
      Alert.alert('Thành công', 'Video đã được tải lên thành công!');
    } catch (error) {
      console.error('VideoUploader: Upload error:', error);
      onUploadError?.(error);
      Alert.alert('Tải lên thất bại', 'Không thể tải lên video. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const showVideoOptions = () => {
    Alert.alert(
      'Chọn Video',
      'Bạn muốn chọn video từ thư viện hay quay video mới?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thư viện', onPress: pickVideo },
        { text: 'Quay video', onPress: takeVideo },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      {/* Video Selection Area */}
      <View style={styles.videoSelectionArea}>
        {selectedVideos.length === 0 ? (
          <TouchableOpacity
            style={[styles.selectButton, disabled && styles.disabledButton]}
            onPress={showVideoOptions}
            disabled={disabled || uploading}
          >
            <Ionicons name="videocam-outline" size={32} color={COLORS.primary} />
            <Text style={styles.selectButtonText}>Chọn Video</Text>
            <Text style={styles.selectButtonSubtext}>Tối đa {maxVideos} video</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedVideosContainer}>
            {selectedVideos.map((video, index) => (
              <View key={index} style={styles.videoItem}>
                <View style={styles.videoInfo}>
                  <Ionicons name="videocam" size={24} color={COLORS.primary} />
                  <View style={styles.videoDetails}>
                    <Text style={styles.videoName} numberOfLines={1}>
                      {video.fileName || 'video.mp4'}
                    </Text>
                    <Text style={styles.videoMeta}>
                      {video.duration ? formatDuration(video.duration) : 'Unknown duration'} • {' '}
                      {video.fileSize ? formatFileSize(video.fileSize) : 'Unknown size'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeVideo(index)}
                  disabled={disabled || uploading}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Upload Button */}
      {selectedVideos.length > 0 && (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && styles.uploadingButton,
            disabled && styles.disabledButton,
          ]}
          onPress={uploadVideos}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <View style={styles.uploadingContent}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Đang tải lên...</Text>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Tải lên Video</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  videoSelectionArea: {
    marginBottom: 12,
  },
  selectButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  selectButtonSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  selectedVideosContainer: {
    gap: 8,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoDetails: {
    marginLeft: 12,
    flex: 1,
  },
  videoName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  videoMeta: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  uploadingButton: {
    backgroundColor: COLORS.gray,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
