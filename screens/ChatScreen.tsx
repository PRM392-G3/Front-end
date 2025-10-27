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
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Phone, Video, Info, MoreVertical } from 'lucide-react-native';
import ChatMessage, { Message } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import signalRService from '@/services/signalRService';
import { chatAPI, Message as APIMessage, Conversation } from '@/services/chatAPI';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const conversationId = id ? parseInt(id) : 0;

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      if (!conversationId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Load messages from API
        const apiMessages = await chatAPI.getConversationMessages(conversationId);
        
        // Convert API messages to component messages
        const convertedMessages: Message[] = apiMessages.map(msg => ({
          id: msg.id.toString(),
          text: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isSent: msg.senderId === user.id,
          isRead: true,
        }));

        setMessages(convertedMessages);

        // Determine other user info from first message
        if (apiMessages.length > 0) {
          const firstMsg = apiMessages[0];
          const other = firstMsg.senderId === user.id
            ? { name: conversation?.user2Name || 'User', avatar: conversation?.user2AvatarUrl || '' }
            : { name: firstMsg.senderName, avatar: firstMsg.senderAvatarUrl };
          setOtherUser(other);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[ChatScreen] Error loading messages:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [conversationId, user]);

  // Listen for real-time messages via SignalR
  useEffect(() => {
    if (!signalRService.isConnected()) return;

    const handleMessage = (data: any) => {
      console.log('[ChatScreen] Received SignalR message:', data);
      
      if (data.conversationId === conversationId) {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: data.message,
          timestamp: new Date(data.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isSent: data.fromUserId === user?.id,
          isRead: false,
        };
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    signalRService.onReceiveMessage(handleMessage);

    return () => {
      // Cleanup
    };
  }, [conversationId, user]);

  const handleSendMessage = async (text: string) => {
    if (!user || !conversationId) return;

    // Optimistically add message to UI
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

    setMessages(prev => [...prev, newMessage]);

    try {
      // Save to database via API
      console.log('[ChatScreen] Sending message to API...');
      const sentMessage = await chatAPI.sendMessage({
        conversationId,
        senderId: user.id,
        content: text,
      });

      console.log('[ChatScreen] Message sent successfully:', sentMessage);

      // Send via SignalR for real-time (if connected)
      if (signalRService.isConnected() && conversation) {
        const toUserId = user.id === conversation.user1Id 
          ? conversation.user2Id 
          : conversation.user1Id;
        
        try {
          await signalRService.sendMessageToUser(toUserId, text, conversationId);
          console.log('[ChatScreen] Message sent via SignalR');
        } catch (error) {
          console.warn('[ChatScreen] SignalR send failed (non-critical):', error);
        }
      }
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      // Optionally remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />

      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUser?.name || 'User'}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  signalRService.isConnected() ? styles.statusOnline : styles.statusOffline
                ]} />
                <Text style={styles.headerStatus} numberOfLines={1}>
                  {signalRService.isConnected() ? 'Đang hoạt động' : 'Đang kết nối...'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Phone size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Video size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <MoreVertical size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Area */}
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

      {/* Enhanced Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSelectImage={() => console.log('Select image')}
        onSelectCamera={() => console.log('Open camera')}
        onSelectVideo={() => console.log('Record video')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: RESPONSIVE_SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerAvatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusOnline: {
    backgroundColor: '#4ADE80',
  },
  statusOffline: {
    backgroundColor: '#9CA3AF',
  },
  headerStatus: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messages: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    color: '#9CA3AF',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    fontWeight: '500',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
