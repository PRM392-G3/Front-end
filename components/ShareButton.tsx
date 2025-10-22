import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shareAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ShareButtonProps {
  postId: number;
  shareCount: number;
  isShared?: boolean;
  onShareToggle?: (postId: number, isShared: boolean) => void;
  onRefresh?: () => void;
  disabled?: boolean;
}

export default function ShareButton({ 
  postId, 
  shareCount, 
  isShared = false, 
  onShareToggle,
  onRefresh,
  disabled = false 
}: ShareButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState('');

  const handleShare = async () => {
    if (!user?.id || isLoading || disabled) return;

    if (isShared) {
      // Show confirmation dialog for unshare
      Alert.alert(
        'Bỏ chia sẻ',
        'Bạn có chắc chắn muốn bỏ chia sẻ bài viết này?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Bỏ chia sẻ', style: 'destructive', onPress: handleUnshare }
        ]
      );
    } else {
      // Show share modal to get caption
      setShowShareModal(true);
    }
  };

  const handleUnshare = async () => {
    if (!user?.id || isLoading) return;

    try {
      setIsLoading(true);
      
      await shareAPI.unsharePost(user.id, postId);
      onShareToggle?.(postId, false);
      
      // Tự động refresh sau khi unshare thành công
      setTimeout(() => {
        onRefresh?.();
      }, 500); // Delay ngắn để đảm bảo API đã hoàn thành
      
      Alert.alert('Thành công', 'Đã bỏ chia sẻ bài viết!');
    } catch (error: any) {
      console.error('ShareButton: Error unsharing post:', error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 400) {
        Alert.alert('Lỗi', 'Không thể bỏ chia sẻ bài viết này.');
      } else {
        Alert.alert('Lỗi', 'Không thể bỏ chia sẻ bài viết. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmShare = async () => {
    if (!user?.id || isLoading) return;

    try {
      setIsLoading(true);
      
      // Share the post with caption (always public for now)
      await shareAPI.sharePost(user.id, postId, shareCaption.trim() || undefined, true);
      onShareToggle?.(postId, true);
      setShowShareModal(false);
      setShareCaption('');
      
      Alert.alert('Thành công', 'Bài viết đã được chia sẻ!');
    } catch (error: any) {
      console.error('ShareButton: Error sharing post:', error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 400) {
        Alert.alert('Lỗi', 'Bạn đã chia sẻ bài viết này rồi.');
      } else {
        Alert.alert('Lỗi', 'Không thể chia sẻ bài viết. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelShare = () => {
    setShowShareModal(false);
    setShareCaption('');
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.shareButton,
          isShared && styles.shareButtonActive,
          (isLoading || disabled) && styles.shareButtonDisabled
        ]}
        onPress={handleShare}
        disabled={isLoading || disabled}
      >
        <Ionicons
          name={isShared ? "share" : "share-outline"}
          size={20}
          color={isShared ? "#007AFF" : "#666"}
        />
        <Text style={[
          styles.shareText,
          isShared && styles.shareTextActive,
          (isLoading || disabled) && styles.shareTextDisabled
        ]}>
          {shareCount}
        </Text>
      </TouchableOpacity>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelShare}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chia sẻ bài viết</Text>
              <TouchableOpacity onPress={handleCancelShare}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.captionLabel}>Thêm chú thích (tùy chọn)</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Viết gì đó về bài viết này..."
                value={shareCaption}
                onChangeText={setShareCaption}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {shareCaption.length}/500
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelShare}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.shareButtonModal,
                  isLoading && styles.modalButtonDisabled
                ]}
                onPress={handleConfirmShare}
                disabled={isLoading}
              >
                <Text style={styles.shareButtonText}>
                  {isLoading ? 'Đang chia sẻ...' : 'Chia sẻ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  shareButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  shareTextActive: {
    color: '#007AFF',
  },
  shareTextDisabled: {
    color: '#999',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  shareButtonModal: {
    backgroundColor: '#007AFF',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
