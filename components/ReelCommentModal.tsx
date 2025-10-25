import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { X, Send, Heart } from 'lucide-react-native';
import { Comment as ApiComment } from '@/services/api';

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  isLiked: boolean;
  timestamp: string;
}

interface ReelCommentModalProps {
  visible: boolean;
  onClose: () => void;
  comments?: Comment[];
}

export default function ReelCommentModal({
  visible,
  onClose,
  comments = [],
}: ReelCommentModalProps) {
  const [commentText, setCommentText] = useState('');
  const [commentList, setCommentList] = useState<Comment[]>(comments);

  const handleSendComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        username: 'Bạn',
        text: commentText.trim(),
        likes: 0,
        isLiked: false,
        timestamp: 'Vừa xong',
      };
      setCommentList([...commentList, newComment]);
      setCommentText('');
    }
  };

  const handleLikeComment = (id: string) => {
    setCommentList((prev) =>
      prev.map((comment) =>
        comment.id === id
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bình luận</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <ScrollView style={styles.commentsList}>
            {commentList.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.avatarText}>
                    {comment.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUsername}>{comment.username}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentTime}>{comment.timestamp}</Text>
                    <TouchableOpacity>
                      <Text style={styles.commentReply}>Trả lời</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleLikeComment(comment.id)}
                  style={styles.likeButton}
                >
                  <Heart
                    size={16}
                    color={comment.isLiked ? COLORS.error : COLORS.gray}
                    fill={comment.isLiked ? COLORS.error : 'transparent'}
                  />
                  {comment.likes > 0 && (
                    <Text
                      style={[
                        styles.likeCount,
                        comment.isLiked && styles.likedCount,
                      ]}
                    >
                      {comment.likes}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputAvatar}>
              <Text style={styles.avatarText}>B</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Viết bình luận..."
                placeholderTextColor={COLORS.gray}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
            </View>
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentText.trim()}
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
            >
              <Send
                size={20}
                color={commentText.trim() ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  commentUsername: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  commentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.black,
    lineHeight: 18,
  },
  commentMeta: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.md,
    marginTop: 4,
    marginLeft: RESPONSIVE_SPACING.md,
  },
  commentTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  commentReply: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    fontWeight: '600',
  },
  likeButton: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  likeCount: {
    fontSize: 11,
    color: COLORS.gray,
  },
  likedCount: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    gap: RESPONSIVE_SPACING.sm,
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
  },
  input: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

