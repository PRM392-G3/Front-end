import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Info } from 'lucide-react-native';
import ChatMessage, { Message } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { chatAPI, Message as APIMessage } from '@/services/chatAPI';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (id && user) {
      loadConversation();
      loadMessages();
    }
  }, [id, user]);

  const loadConversation = async () => {
    try {
      // Get conversation details to find other user
      const conversations = await chatAPI.getUserConversations(user?.id || 0);
      const conv = conversations.find(c => c.id === parseInt(id));
      
      if (conv) {
        setConversation(conv);
        
        // Determine which user is the other user
        const otherUserId = conv.user1Id === user?.id ? conv.user2Id : conv.user1Id;
        
        // Set other user info from conversation
        const otherUserData = {
          id: otherUserId,
          name: conv.user1Id === user?.id ? conv.user2Name : conv.user1Name,
          avatar: conv.user1Id === user?.id ? conv.user2AvatarUrl : conv.user1AvatarUrl,
        };
        
        setOtherUser(otherUserData);
      }
    } catch (error) {
      console.error('❌ [ChatScreen] Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('🚀 [ChatScreen] Loading messages for conversation:', id);
      
      const messagesData = await chatAPI.getConversationMessages(parseInt(id));
      console.log('✅ [ChatScreen] Messages loaded:', messagesData);
      
      // Convert API messages to UI messages
      const uiMessages: Message[] = messagesData.map((msg: APIMessage) => ({
        id: msg.id.toString(),
        text: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: msg.senderId === user?.id,
        isRead: true,
        imageUrl: msg.imageUrl,
        videoUrl: msg.videoUrl,
        avatarUrl: msg.senderAvatarUrl,
        senderName: msg.senderName,
      }));
      
      setMessages(uiMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
      
    } catch (error) {
      console.error('❌ [ChatScreen] Error loading messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !id) return;
    
    try {
      setSending(true);
      console.log('🚀 [ChatScreen] Sending message:', text);
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        text,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: true,
        isRead: false,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Send to API
      const apiMessage = await chatAPI.sendMessage({
        conversationId: parseInt(id),
        senderId: user.id,
        content: text,
      });
      
      console.log('✅ [ChatScreen] Message sent successfully:', apiMessage);
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? {
              ...msg,
              id: apiMessage.id.toString(),
              isRead: true,
            }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ [ChatScreen] Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== Date.now().toString()));
    } finally {
      setSending(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleViewProfile = () => {
    if (otherUser) {
      router.push(`/profile?userId=${otherUser.id}` as any);
    }
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để gửi ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMediaMessage(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const handleSelectCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMediaMessage(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const handleSelectVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện video để gửi video');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMediaMessage(result.assets[0].uri, 'video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Lỗi', 'Không thể chọn video');
    }
  };

  const sendMediaMessage = async (uri: string, type: 'image' | 'video') => {
    if (!user || !id) return;

    try {
      setSending(true);
      
      // Import mediaAPI để upload file
      const { mediaAPI } = await import('@/services/mediaAPI');
      
      console.log('📤 [ChatScreen] Uploading media:', { uri, type });
      
      // Upload media file based on type
      let uploadResult;
      if (type === 'image') {
        uploadResult = await mediaAPI.uploadImage(uri, 'chat');
      } else {
        uploadResult = await mediaAPI.uploadVideo(uri, 'chat');
      }
      
      console.log('✅ [ChatScreen] Media uploaded:', uploadResult);
      
      // Send message with media URL
      const apiMessage = await chatAPI.sendMessage({
        conversationId: parseInt(id),
        senderId: user.id,
        content: '',
        imageUrl: type === 'image' ? uploadResult.publicUrl : undefined,
        videoUrl: type === 'video' ? uploadResult.publicUrl : undefined,
      });
      
      console.log('✅ [ChatScreen] Media message sent successfully:', apiMessage);
      
      // Reload messages
      await loadMessages();
      
    } catch (error) {
      console.error('❌ [ChatScreen] Error sending media message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn media');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerInfo} onPress={handleViewProfile}>
          <View style={styles.headerAvatar}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarText}>
                {otherUser?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            )}
          </View>
          <Text style={styles.headerName}>{otherUser?.name || 'Loading...'}</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleViewProfile}>
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
        onSelectImage={handleSelectImage}
        onSelectCamera={handleSelectCamera}
        onSelectVideo={handleSelectVideo}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
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
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
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
