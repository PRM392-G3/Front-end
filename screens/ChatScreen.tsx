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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Phone, Video, Info, MoreVertical } from 'lucide-react-native';
import ChatMessage, { Message } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import signalRService from '@/services/signalRService';
import { chatAPI, Message as APIMessage, Conversation } from '@/services/chatAPI';
import { mediaAPI } from '@/services/mediaAPI';
import AppStatusBar from '@/components/AppStatusBar';

export default function ChatScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
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

      // If caller passed a name param, use it as an immediate fallback while we load conversation
      if (name && !otherUser) {
        setOtherUser({ name: decodeURIComponent(name), avatar: '' });
      }

      try {
        // Load conversation details (to get other user's name/avatar)
        const conv = await chatAPI.getConversationById(conversationId);
        if (conv) {
          setConversation(conv);
          // Determine the other participant based on current user
          const other = user.id === conv.user1Id
            ? { name: conv.user2Name || 'User', avatar: conv.user2AvatarUrl || '' }
            : { name: conv.user1Name || 'User', avatar: conv.user1AvatarUrl || '' };
          setOtherUser(other);
        }
        // Load messages from API
        const apiMessages = await chatAPI.getConversationMessages(conversationId);
        
        // Convert API messages to component messages
        const convertedMessages: Message[] = apiMessages.map(msg => ({
          id: msg.id.toString(),
          text: msg.content,
          imageUrl: msg.imageUrl,
          videoUrl: msg.videoUrl,
          timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isSent: msg.senderId === user.id,
          isRead: true,
        }));

        setMessages(convertedMessages);

        // If conversation wasn't available above, fallback to first message
        if (!conv && apiMessages.length > 0) {
          const firstMsg = apiMessages[0];
          const other = firstMsg.senderId === user.id
            ? { name: 'Người dùng', avatar: '' }
            : { name: firstMsg.senderName || 'Người dùng', avatar: firstMsg.senderAvatarUrl || '' };
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

  // Poll for new messages every 3 seconds as fallback
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    
    if (conversationId && user) {
      console.log('[ChatScreen] Starting message polling...');
      
      pollInterval = setInterval(async () => {
        try {
          const apiMessages = await chatAPI.getConversationMessages(conversationId);
          const convertedMessages: Message[] = apiMessages.map(msg => ({
            id: msg.id.toString(),
            text: msg.content,
            imageUrl: msg.imageUrl,
            videoUrl: msg.videoUrl,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isSent: msg.senderId === user.id,
            isRead: true,
          }));
          
          console.log('[ChatScreen] Polling: Converted messages with images:', convertedMessages.length);
          
          // Update messages - smart merge to keep optimistic updates
          setMessages(prev => {
            // Only update if message count changed (new message received)
            if (prev.length !== convertedMessages.length) {
              console.log('[ChatScreen] New message detected via polling');
              
              // Merge: Keep optimistic messages, add new ones from API
              const prevIds = new Set(prev.map(m => m.id));
              const apiIds = new Set(convertedMessages.map(m => m.id));
              
              // Add new messages from API
              const newMessages = convertedMessages.filter(msg => !prevIds.has(msg.id));
              
              console.log('[ChatScreen] Adding', newMessages.length, 'new messages from API');
              
              // Return: existing optimistic + new from API
              return [...prev, ...newMessages];
            }
            
            return prev;
          });
        } catch (error) {
          console.error('[ChatScreen] Polling error:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('[ChatScreen] Polling stopped');
      }
    };
  }, [conversationId, user]);

  // Listen for real-time messages via SignalR
  useEffect(() => {
    console.log('[ChatScreen] Setting up SignalR listener...');
    console.log('[ChatScreen] SignalR connected:', signalRService.isConnected());
    console.log('[ChatScreen] Conversation ID:', conversationId);
    
    if (!signalRService.isConnected()) {
      console.warn('[ChatScreen] SignalR not connected, using polling fallback');
      return;
    }

    const handleMessage = (data: any) => {
      console.log('🔔 [ChatScreen] Received SignalR message:', JSON.stringify(data, null, 2));
      
      // Try to match conversation ID (handle both number and string)
      const messageConvId = parseInt(data.conversationId);
      const currentConvId = parseInt(conversationId as any);
      
      if (messageConvId === currentConvId) {
        console.log('✅ [ChatScreen] Message matches conversation, adding to UI');
        const newMessage: Message = {
          id: Date.now().toString(),
          text: data.message || data.content || '',
          timestamp: new Date(data.timestamp || data.createdAt || new Date()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isSent: (data.fromUserId === user?.id) || (data.senderId === user?.id),
          isRead: false,
        };
        
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => 
            m.text === newMessage.text && 
            Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000
          );
          
          if (exists) {
            return prev;
          }
          
          console.log('✅ [ChatScreen] Adding new message to list via SignalR');
          return [...prev, newMessage];
        });
        
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    signalRService.onReceiveMessage(handleMessage);
    console.log('✅ [ChatScreen] SignalR listener registered');

    return () => {
      console.log('[ChatScreen] Cleaning up SignalR listener');
    };
  }, [conversationId, user]);

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!user || !conversationId) return;

    // Optimistically add message to UI
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      imageUrl,
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
        imageUrl,
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

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('[ChatScreen] Selected image:', imageUri);
        
        // Upload image
        try {
          const uploadResult = await mediaAPI.uploadImage(imageUri, 'chat');
          console.log('[ChatScreen] Image uploaded:', uploadResult);
          
          if (uploadResult.publicUrl) {
            // Send message with image
            handleSendMessage('', uploadResult.publicUrl);
          }
        } catch (uploadError) {
          console.error('[ChatScreen] Upload error:', uploadError);
          Alert.alert('Lỗi', 'Không thể tải lên ảnh');
        }
      }
    } catch (error) {
      console.error('[ChatScreen] Image selection error:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('[ChatScreen] Photo taken:', imageUri);
        
        // Upload image
        try {
          const uploadResult = await mediaAPI.uploadImage(imageUri, 'chat');
          console.log('[ChatScreen] Photo uploaded:', uploadResult);
          
          if (uploadResult.publicUrl) {
            // Send message with image
            handleSendMessage('', uploadResult.publicUrl);
          }
        } catch (uploadError) {
          console.error('[ChatScreen] Upload error:', uploadError);
          Alert.alert('Lỗi', 'Không thể tải lên ảnh');
        }
      }
    } catch (error) {
      console.error('[ChatScreen] Camera error:', error);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <AppStatusBar barStyle="light-content" />
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
      <AppStatusBar barStyle="light-content" />

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

          {/* Header actions removed per design: no call/video/more buttons */}
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
        onSelectImage={handleSelectImage}
        onSelectCamera={handleTakePhoto}
        onSelectVideo={() => Alert.alert('Coming Soon', 'Tính năng video sẽ sớm ra mắt')}
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
