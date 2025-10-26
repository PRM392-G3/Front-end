import { api } from './api';

export interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  user1Name: string;
  user2Name: string;
  user1AvatarUrl: string;
  user2AvatarUrl: string;
  createdAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface GroupChatMessage {
  id: number;
  groupId: number;
  groupName: string;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string;
  content: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  user1Id: number;
  user2Id: number;
}

export interface SendMessageRequest {
  conversationId: number;
  senderId: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface SendGroupMessageRequest {
  groupId: number;
  senderId: number;
  content: string;
}

class ChatAPI {
  // ==================== CONVERSATION ENDPOINTS ====================

  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const response = await api.post('/chat/conversations', request);
    return response.data;
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | null> {
    try {
      const response = await api.get(`/chat/conversations/${user1Id}/${user2Id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getOrCreateConversation(request: CreateConversationRequest): Promise<Conversation> {
    // Try to get existing conversation first
    const existing = await this.getConversation(request.user1Id, request.user2Id);
    if (existing) {
      return existing;
    }
    
    // Create new conversation if not exists
    return await this.createConversation(request);
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    console.log('chatAPI: Getting conversations for user:', userId);
    console.log('chatAPI: API instance:', api);
    console.log('chatAPI: API baseURL:', api.defaults.baseURL);

    const response = await api.get(`/chat/conversations/user/${userId}`);
    return response.data;
  }

  // ==================== MESSAGE ENDPOINTS ====================

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const response = await api.post('/chat/messages', request);
    return response.data;
  }

  async getConversationMessages(
    conversationId: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<Message[]> {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  }

  // ==================== GROUP MESSAGE ENDPOINTS ====================

  async sendGroupMessage(request: SendGroupMessageRequest): Promise<GroupChatMessage> {
    const response = await api.post('/chat/group-messages', request);
    return response.data;
  }

  async getGroupMessages(
    groupId: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<GroupChatMessage[]> {
    const response = await api.get(`/chat/groups/${groupId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  }
}

export const chatAPI = new ChatAPI();
