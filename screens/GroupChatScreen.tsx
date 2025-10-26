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
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react-native';
import ChatMessage, { Message } from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatAPI, GroupChatMessage } from '@/services/chatAPI';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/services/api';

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (user && params.id) {
      loadGroupData();
      loadMessages();
    }
  }, [user, params.id]);

  const loadGroupData = async () => {
    try {
      const { groupAPI } = await import('@/services/api');
      const groupData = await groupAPI.getGroupById(parseInt(params.id as string));
      setGroup(groupData);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  };

  const loadMessages = async () => {
    if (!user || !params.id) return;
    
    try {
      setLoading(true);
      console.log('🚀 [GroupChat] Loading messages for group:', params.id);
      
      const apiMessages = await chatAPI.getGroupMessages(
        parseInt(params.id as string),
        1,
        50
      );
      
      console.log('✅ [GroupChat] Messages loaded:', apiMessages);
      
      const formattedMessages = apiMessages.map(msg => ({
        id: msg.id.toString(),
        text: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: msg.senderId === user.id,
        isRead: true,
        imageUrl: msg.imageUrl,
        videoUrl: msg.videoUrl,
        avatarUrl: msg.senderAvatarUrl,
        senderName: msg.senderName,
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('❌ [GroupChat] Error loading messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !params.id || !text.trim()) return;
    
    try {
      setSending(true);
      
      const apiMessage = await chatAPI.sendGroupMessage({
        groupId: parseInt(params.id as string),
        senderId: user.id,
        content: text.trim(),
      });
      
      const newMessage: Message = {
        id: apiMessage.id.toString(),
        text: apiMessage.content,
        timestamp: new Date(apiMessage.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: true,
        isRead: true,
        imageUrl: apiMessage.imageUrl,
        videoUrl: apiMessage.videoUrl,
        avatarUrl: apiMessage.senderAvatarUrl,
        senderName: apiMessage.senderName,
      };
      
      setMessages([...messages, newMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ [GroupChat] Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages]);

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
    if (!user || !params.id) return;

    try {
      setSending(true);
      
      // Import mediaAPI để upload file
      const { mediaAPI } = await import('@/services/mediaAPI');
      
      console.log('📤 [GroupChat] Uploading media:', { uri, type });
      
      // Upload media file based on type
      let uploadResult;
      if (type === 'image') {
        uploadResult = await mediaAPI.uploadImage(uri, 'chat');
      } else {
        uploadResult = await mediaAPI.uploadVideo(uri, 'chat');
      }
      
      console.log('✅ [GroupChat] Media uploaded:', uploadResult);
      
      // Send message with media URL
      const apiMessage = await chatAPI.sendGroupMessage({
        groupId: parseInt(params.id as string),
        senderId: user.id,
        content: '',
        imageUrl: type === 'image' ? uploadResult.publicUrl : undefined,
        videoUrl: type === 'video' ? uploadResult.publicUrl : undefined,
      });
      
      console.log('✅ [GroupChat] Media message sent successfully:', apiMessage);
      
      // Add message to UI
      const newMessage: Message = {
        id: apiMessage.id.toString(),
        text: apiMessage.content,
        timestamp: new Date(apiMessage.createdAt).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: true,
        isRead: true,
        imageUrl: apiMessage.imageUrl,
        videoUrl: apiMessage.videoUrl,
        avatarUrl: apiMessage.senderAvatarUrl,
        senderName: apiMessage.senderName,
      };
      
      setMessages([...messages, newMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ [GroupChat] Error sending media message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn media');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Không tìm thấy nhóm</Text>
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
      <View style={[styles.header, { paddingTop: insets.top + RESPONSIVE_SPACING.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => router.push(`/group-detail?id=${group.id}`)}
        >
          {group.avatarUrl ? (
            <Image source={{ uri: group.avatarUrl }} style={styles.headerAvatarImage} />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {group.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{group.name}</Text>
            <Text style={styles.headerStatus}>
              {group.memberCount} thành viên
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/group-detail?id=${group.id}`)}
          >
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
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện!</Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.senderName !== message.senderName;

            return (
              <ChatMessage
                key={message.id}
                message={message}
                showAvatar={showAvatar}
              />
            );
          })
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
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
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
});

