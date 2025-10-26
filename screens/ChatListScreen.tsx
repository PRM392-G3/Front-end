import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { MessageCircle } from 'lucide-react-native';
import { chatAPI, Conversation } from '@/services/chatAPI';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🚀 [ChatListScreen] Loading conversations for user:', user.id);
      
      const data = await chatAPI.getUserConversations(user.id);
      console.log('✅ [ChatListScreen] Conversations loaded:', data);
      
      setConversations(data);
    } catch (error) {
      console.error('❌ [ChatListScreen] Error loading conversations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleStartChat = async (otherUserId: number) => {
    if (!user?.id) return;
    
    try {
      console.log('🚀 [ChatListScreen] Starting chat with user:', otherUserId);
      
      const conversation = await chatAPI.getOrCreateConversation({
        user1Id: user.id,
        user2Id: otherUserId,
      });
      
      console.log('✅ [ChatListScreen] Conversation created:', conversation);
      
      router.push(`/chat/${conversation.id}` as any);
    } catch (error) {
      console.error('❌ [ChatListScreen] Error starting chat:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu cuộc trò chuyện');
    }
  };

  const handleConversationPress = (conversationId: number) => {
    router.push(`/chat/${conversationId}` as any);
  };

  const handleSearchPress = () => {
    router.push('/search' as any);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = user?.id === item.user1Id 
      ? { name: item.user2Name, avatar: item.user2AvatarUrl }
      : { name: item.user1Name, avatar: item.user1AvatarUrl };

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherUser.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{otherUser.name}</Text>
            {item.lastMessage && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={64} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có cuộc trò chuyện nào
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tin nhắn</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversation}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.secondary,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginRight: RESPONSIVE_SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  conversationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  lastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: RESPONSIVE_SPACING.lg,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xl,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.sm,
  },
  searchButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
