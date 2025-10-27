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
      {/* Avatar for received messages */}
      {!message.isSent && showAvatar && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {message.avatarUrl ? (
              <Image source={{ uri: message.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {message.senderName?.charAt(0).toUpperCase() || 'A'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Message content */}
      <View style={[
        styles.messageContainer,
        message.isSent && styles.sentMessageContainer
      ]}>
        {/* Text message bubble */}
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

        {/* Image message */}
        {message.imageUrl && (
          <View style={[styles.mediaContainer, message.isSent && styles.sentMediaContainer]}>
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
          </View>
        )}

        {/* Video message */}
        {message.videoUrl && (
          <View style={[styles.mediaContainer, message.isSent && styles.sentMediaContainer]}>
            <VideoPlayer uri={message.videoUrl} />
          </View>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionContainer}>
            {message.reactions.map((reaction, index) => (
              <Text key={index} style={styles.reactionEmoji}>
                {reaction}
              </Text>
            ))}
          </View>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <Text style={[
            styles.timestamp,
            message.isSent ? styles.sentTimestamp : styles.receivedTimestamp
          ]}>
            {message.timestamp}
          </Text>
        )}
      </View>

      {/* Read receipt */}
      {message.isSent && message.isRead && (
        <Text style={styles.readReceipt}>✓✓</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: RESPONSIVE_SPACING.xs,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    alignItems: 'flex-end',
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  messageContainer: {
    maxWidth: '75%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  sentText: {
    color: COLORS.white,
  },
  receivedText: {
    color: '#1F2937',
  },
  mediaContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sentMediaContainer: {
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 220,
    height: 220,
    resizeMode: 'cover',
  },
  messageVideo: {
    width: 250,
    height: 250,
  },
  reactionContainer: {
    flexDirection: 'row',
    marginTop: 4,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  reactionEmoji: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  sentTimestamp: {
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  receivedTimestamp: {
    color: '#9CA3AF',
    alignSelf: 'flex-start',
  },
  readReceipt: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 4,
    marginBottom: 2,
  },
});
