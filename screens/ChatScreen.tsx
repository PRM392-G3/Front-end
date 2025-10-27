import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react-native';
import ChatMessage, { Message } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import signalRService from '@/services/signalRService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Connect to SignalR when screen loads
  useEffect(() => {
    const connectSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token || !user) {
          console.log('[ChatScreen] No token or user, cannot connect');
          setIsLoading(false);
          return;
        }

        console.log('[ChatScreen] Connecting to SignalR...');
        await signalRService.connect(token);
        setIsConnected(true);
        
        // Listen for incoming messages
        signalRService.onReceiveMessage((data) => {
          console.log('[ChatScreen] Received message:', data);
          const newMessage: Message = {
            id: Date.now().toString(),
            text: data.message,
            timestamp: new Date(data.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isSent: data.fromUserId === user.id,
            isRead: false,
          };
          setMessages(prev => [...prev, newMessage]);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('[ChatScreen] SignalR connection error:', error);
        setIsLoading(false);
      }
    };

    connectSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.disconnect();
    };
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!isConnected || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isSent: true,
      isRead: false,
    };

    setMessages([...messages, newMessage]);

    // TODO: Get actual conversationId from props/route
    const conversationId = 1; // This should come from navigation params
    const toUserId = 2; // This should come from navigation params

    try {
      await signalRService.sendMessageToUser(toUserId, text, conversationId);
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Nguyễn Văn A</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Video size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Info size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>Hôm nay</Text>
        </View>

        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar = !prevMessage || prevMessage.isSent !== message.isSent;

          return (
            <ChatMessage
              key={message.id}
              message={message}
              showAvatar={showAvatar}
            />
          );
        })}
      </ScrollView>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSelectImage={() => console.log('Select image')}
        onSelectCamera={() => console.log('Open camera')}
        onVoiceRecord={() => console.log('Record voice')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginRight: RESPONSIVE_SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerStatus: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.xs,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messages: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  messagesContent: {
    paddingTop: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: RESPONSIVE_SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
});
