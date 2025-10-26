import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { VideoView, useVideoPlayer } from 'expo-video';

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  isRead?: boolean;
  reactions?: string[];
  imageUrl?: string;
  videoUrl?: string;
  avatarUrl?: string;
  senderName?: string;
}

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
}

export default function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const VideoPlayer = ({ uri }: { uri: string }) => {
    const player = useVideoPlayer(uri, (player) => {
      player.loop = false;
      player.play();
    });

    return (
      <VideoView
        player={player}
        style={styles.messageVideo}
        contentFit="contain"
        nativeControls
      />
    );
  };
  const [showTimestamp, setShowTimestamp] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setShowTimestamp(!showTimestamp)}
      style={[
        styles.container,
        message.isSent ? styles.sentContainer : styles.receivedContainer,
      ]}
    >
      {!message.isSent && showAvatar && (
        <View style={styles.avatar}>
          {message.avatarUrl ? (
            <Image source={{ uri: message.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {message.senderName?.charAt(0).toUpperCase() || 'A'}
            </Text>
          )}
        </View>
      )}

      <View style={styles.messageWrapper}>
        {message.imageUrl && (
          <View style={[styles.imageContainer, message.isSent && styles.sentImageContainer]}>
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
          </View>
        )}

        {message.videoUrl && (
          <View style={[styles.videoContainer, message.isSent && styles.sentVideoContainer]}>
            <VideoPlayer uri={message.videoUrl} />
          </View>
        )}
        
        {message.text && (
          <View
            style={[
              styles.bubble,
              message.isSent ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              style={[
                styles.text,
                message.isSent ? styles.sentText : styles.receivedText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <View
            style={[
              styles.reactionContainer,
              message.isSent && styles.sentReactionContainer,
            ]}
          >
            {message.reactions.map((reaction, index) => (
              <Text key={index} style={styles.reactionEmoji}>
                {reaction}
              </Text>
            ))}
          </View>
        )}

        {/* Timestamp - chỉ hiện khi bấm vào tin nhắn */}
        {showTimestamp && (
          <View style={[
            styles.timestampContainer,
            message.isSent ? styles.sentTimestampContainer : styles.receivedTimestampContainer
          ]}>
            <Text style={styles.timestampText}>
              {message.timestamp}
            </Text>
          </View>
        )}
      </View>

      {!message.isSent && !showAvatar && <View style={styles.avatarPlaceholder} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.xs,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.xs,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: RESPONSIVE_SPACING.xs,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  messageWrapper: {
    maxWidth: '75%',
    position: 'relative',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: COLORS.lightGray,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: COLORS.black,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sentImageContainer: {
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    maxWidth: 250,
    maxHeight: 250,
  },
  sentVideoContainer: {
    alignSelf: 'flex-end',
  },
  messageVideo: {
    width: 250,
    height: 250,
  },
  reactionContainer: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  sentReactionContainer: {
    left: 8,
    right: 'auto',
  },
  reactionEmoji: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  timestampContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sentTimestampContainer: {
    alignItems: 'flex-end',
  },
  receivedTimestampContainer: {
    alignItems: 'flex-start',
  },
  timestampText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
});

