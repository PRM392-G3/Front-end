import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send } from 'lucide-react-native';
import { COLORS, RESPONSIVE_SPACING } from '@/constants/theme';
import { Comment, commentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface FloatingCommentModalProps {
  visible: boolean;
  onClose: () => void;
  postId: number;
  postOwnerId: number;
  onCommentAdded?: () => void;
}

export default function FloatingCommentModal({
  visible,
  onClose,
  postId,
  postOwnerId,
  onCommentAdded,
}: FloatingCommentModalProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      loadComments();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const loadComments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await commentAPI.getCommentsByPost(postId);
      setComments(response);
      console.log('Loaded comments:', response.length);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!user || !inputText.trim() || isSending) return;

    setIsSending(true);
    const commentText = inputText;
    setInputText('');

    try {
      // Send to API
      const response = await commentAPI.createComment({
        postId,
        userId: user.id,
        content: commentText,
      });

      // Add comment to list
      setComments(prev => [...prev, response]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Notify parent
      onCommentAdded?.();
    } catch (error) {
      console.error('Error sending comment:', error);
      setInputText(commentText);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
              maxHeight: '85%',
              paddingBottom: Math.max(insets.bottom, keyboardHeight > 0 ? keyboardHeight : 0),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bình luận</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.commentsList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent.primary} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
                <Text style={styles.emptySubtext}>Hãy là người đầu tiên bình luận!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.user.avatarUrl || 'https://via.placeholder.com/40' }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                    <View style={styles.commentActions}>
                      <Text style={styles.commentAuthor}>{comment.user.fullName}</Text>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input Section */}
          {user && (
            <View style={styles.inputContainer}>
              <Image
                source={{ uri: user.avatarUrl || 'https://via.placeholder.com/40' }}
                style={styles.inputAvatar}
              />
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Viết bình luận..."
                  placeholderTextColor={COLORS.text.tertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={!inputText.trim() || isSending}
                  style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={COLORS.background.primary} />
                  ) : (
                    <Send size={20} color={inputText.trim() ? COLORS.background.primary : COLORS.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: RESPONSIVE_SPACING.xs,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  loadingContainer: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: RESPONSIVE_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 18,
    padding: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  commentText: {
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: RESPONSIVE_SPACING.xs,
    gap: RESPONSIVE_SPACING.sm,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 20,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.background.tertiary,
  },
});