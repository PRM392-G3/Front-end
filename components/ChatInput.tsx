import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import {
  Image as ImageIcon,
  Smile,
  Mic,
  Send,
  Plus,
  Camera,
} from 'lucide-react-native';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSelectImage?: () => void;
  onSelectCamera?: () => void;
  onVoiceRecord?: () => void;
}

export default function ChatInput({
  onSendMessage,
  onSelectImage,
  onSelectCamera,
  onVoiceRecord,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* More actions menu */}
      {showMoreActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity style={styles.actionItem} onPress={onSelectImage}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B' }]}>
              <ImageIcon size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onSelectCamera}>
            <View style={[styles.actionIcon, { backgroundColor: '#4ECDC4' }]}>
              <Camera size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#95E1D3' }]}>
              <Mic size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        {/* Plus button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowMoreActions(!showMoreActions)}
        >
          <Plus
            size={24}
            color={COLORS.primary}
            style={{
              transform: [{ rotate: showMoreActions ? '45deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>

        {/* Text input container */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            placeholderTextColor={COLORS.gray}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={5000}
          />

          {/* Emoji button */}
          {!hasText && (
            <TouchableOpacity style={styles.emojiButton}>
              <Smile size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Send or voice button */}
        {hasText ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton} onPress={onVoiceRecord}>
            <Mic size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  actionsMenu: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    gap: RESPONSIVE_SPACING.md,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: RESPONSIVE_SPACING.xs,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    maxHeight: 80,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

