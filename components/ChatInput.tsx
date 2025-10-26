import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Send, Image as ImageIcon, Camera, Video } from 'lucide-react-native';

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
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Actions menu */}
      {showActions && (
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

          <TouchableOpacity style={styles.actionItem} onPress={onSelectVideo}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
              <Video size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        {/* Image button */}
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setShowActions(!showActions)}
        >
          <ImageIcon size={24} color={COLORS.primary} />
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
            returnKeyType="default"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              // Không làm gì khi bấm Enter
            }}
          />
        </View>

        {/* Send button */}
        {hasText && (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
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
  },
  actionsMenu: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  actionItem: {
    marginRight: RESPONSIVE_SPACING.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: RESPONSIVE_SPACING.xs,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    maxHeight: 80,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
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

