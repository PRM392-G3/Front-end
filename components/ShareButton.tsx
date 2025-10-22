import React, { useState, useEffect } from 'react';
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
  const [localIsShared, setLocalIsShared] = useState(isShared);
  const [localShareCount, setLocalShareCount] = useState(shareCount);

  // Sync local state with props when they change
  useEffect(() => {
    setLocalIsShared(isShared);
  }, [isShared]);

  useEffect(() => {
    setLocalShareCount(shareCount);
  }, [shareCount]);

  const handleShare = async () => {
    if (!user?.id || isLoading || disabled) return;

    if (localIsShared) {
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
      console.log('ShareButton: Starting unshare process for post:', postId);
      
      try {
        await shareAPI.unsharePost(user.id, postId);
        console.log('ShareButton: Unshare successful, updating UI');
      } catch (apiError: any) {
        console.warn('ShareButton: API unshare failed, checking if post was already unshared:', apiError.message);
        
        // If it's a 404 or specific error, assume it was already unshared
        if (apiError.message?.includes('đã được bỏ chia sẻ') || 
            apiError.message?.includes('chưa chia sẻ') ||
            apiError.response?.status === 404) {
          console.log('ShareButton: Post was already unshared, proceeding with UI update');
        } else {
          // Re-throw other errors
          throw apiError;
        }
      }
      
      // Update local state immediately for instant UI feedback
      setLocalIsShared(false);
      setLocalShareCount(prev => Math.max(0, prev - 1));
      
      // Update parent component
      onShareToggle?.(postId, false);
      
      // Tự động refresh sau khi unshare thành công
      setTimeout(() => {
        onRefresh?.();
      }, 500); // Delay ngắn để đảm bảo API đã hoàn thành
      
      Alert.alert('Thành công', 'Đã bỏ chia sẻ bài viết!');
    } catch (error: any) {
      console.error('ShareButton: Error unsharing post:', error);
      console.error('ShareButton: Error type:', typeof error);
      console.error('ShareButton: Error message:', error.message);
      
      // Handle different error types
      if (error.message === 'Phiên đăng nhập hết hạn') {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
          [{ text: 'OK' }]
        );
      } else if (error.message === 'Bài viết không tồn tại hoặc đã được bỏ chia sẻ') {
        Alert.alert('Thông báo', 'Bài viết đã được bỏ chia sẻ hoặc không tồn tại.');
        // Still update UI to reflect current state
        onShareToggle?.(postId, false);
      } else if (error.message === 'Bài viết này không thể bỏ chia sẻ hoặc bạn chưa chia sẻ bài viết này') {
        Alert.alert('Thông báo', 'Bạn chưa chia sẻ bài viết này hoặc bài viết không thể bỏ chia sẻ.');
        // Still update UI to reflect current state
        onShareToggle?.(postId, false);
      } else if (error.message === 'Lỗi kết nối mạng. Vui lòng thử lại sau.') {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (error.response?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 400) {
        Alert.alert('Lỗi', 'Không thể bỏ chia sẻ bài viết này. Có thể bạn chưa chia sẻ bài viết này.');
        // Still update UI to reflect current state
        onShareToggle?.(postId, false);
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể bỏ chia sẻ bài viết. Vui lòng thử lại.');
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
      
      // Update local state immediately for instant UI feedback
      setLocalIsShared(true);
      setLocalShareCount(prev => prev + 1);
      
      // Notify parent component
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
          localIsShared && styles.shareButtonActive,
          (isLoading || disabled) && styles.shareButtonDisabled
        ]}
        onPress={handleShare}
        disabled={isLoading || disabled}
      >
        <Ionicons
          name={localIsShared ? "share" : "share-outline"}
          size={20}
          color={localIsShared ? "#007AFF" : "#666"}
        />
        <Text style={[
          styles.shareText,
          localIsShared && styles.shareTextActive,
          (isLoading || disabled) && styles.shareTextDisabled
        ]}>
          {localShareCount}
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
