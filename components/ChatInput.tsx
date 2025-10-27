import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Send, Image as ImageIcon, Camera, Video, SmilePlus } from 'lucide-react-native';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSelectImage?: () => void;
  onSelectCamera?: () => void;
  onSelectVideo?: () => void;
}

export default function ChatInput({
  onSendMessage,
  onSelectImage,
  onSelectCamera,
  onSelectVideo,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showActions, setShowActions] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setShowActions(false);
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Actions menu */}
      {showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => {
              onSelectImage?.();
              setShowActions(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconImage]}>
              <ImageIcon size={22} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => {
              onSelectCamera?.();
              setShowActions(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconCamera]}>
              <Camera size={22} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => {
              onSelectVideo?.();
              setShowActions(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconVideo]}>
              <Video size={22} color={COLORS.white} />
            </View>
            <Text style={styles.actionLabel}>Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input container */}
      <View style={styles.container}>
        {/* Attachment button */}
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={() => setShowActions(!showActions)}
          activeOpacity={0.6}
        >
          <ImageIcon size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Emoji button */}
        {!hasText && (
          <TouchableOpacity 
            style={styles.emojiButton}
            activeOpacity={0.6}
          >
            <SmilePlus size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={5000}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="center"
          />
        </View>

        {/* Send button */}
        {hasText && (
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Send size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionsMenu: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: '#F9FAFB',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconImage: {
    backgroundColor: '#FF6B6B',
  },
  actionIconCamera: {
    backgroundColor: '#4ECDC4',
  },
  actionIconVideo: {
    backgroundColor: '#FF9800',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    gap: RESPONSIVE_SPACING.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 100,
    minHeight: 40,
  },
  input: {
    fontSize: FONT_SIZES.md,
    color: '#1F2937',
    maxHeight: 80,
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
