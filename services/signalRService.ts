import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export interface ChatMessage {
  messageId: string;
  fromUserId: number;
  toUserId: number;
  message: string;
  timestamp: string;
  conversationId: number;
}

export interface GroupMessage {
  messageId: string;
  userId: number;
  message: string;
  groupId: number;
  timestamp: string;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private isConnecting = false;

  async connect(token: string): Promise<void> {
    if (this.connection && this.connection.state === 'Connected') {
      console.log('[SignalR] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[SignalR] Connection in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://2fefeca44269.ngrok-free.app/api';
      
      console.log('[SignalR] Connecting to:', apiUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(`${apiUrl}/chathub`, {
          accessTokenFactory: () => token,
          withCredentials: true,
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.elapsedMilliseconds < 60000) {
              return 2000; // Reconnect after 2 seconds
            }
            return 60000; // After 1 minute, reconnect every minute
          },
        })
        .build();

      // Connection event handlers
      this.connection.onreconnecting(() => {
        console.log('[SignalR] Reconnecting...');
      });

      this.connection.onreconnected(() => {
        console.log('[SignalR] Reconnected successfully');
      });

      this.connection.onclose((error) => {
        console.log('[SignalR] Connection closed:', error);
      });

      await this.connection.start();
      console.log('[SignalR] Connected successfully');
      this.isConnecting = false;
    } catch (error) {
      console.error('[SignalR] Connection error:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log('[SignalR] Disconnected');
    }
  }

  // ==================== MESSAGE HANDLERS ====================
  
  onReceiveMessage(callback: (message: ChatMessage) => void): void {
    if (!this.connection) return;
    
    this.connection.on('ReceiveMessage', (data) => {
      console.log('[SignalR] Received message:', data);
      callback(data);
    });
  }

  onReceiveGroupMessage(callback: (message: GroupMessage) => void): void {
    if (!this.connection) return;
    
    this.connection.on('ReceiveGroupMessage', (data) => {
      console.log('[SignalR] Received group message:', data);
      callback(data);
    });
  }

  onMessageSent(callback: (confirmation: any) => void): void {
    if (!this.connection) return;
    
    this.connection.on('MessageSent', (data) => {
      console.log('[SignalR] Message sent confirmation:', data);
      callback(data);
    });
  }

  onUserConnected(callback: (userId: string) => void): void {
    if (!this.connection) return;
    
    this.connection.on('UserConnected', (userId) => {
      console.log('[SignalR] User connected:', userId);
      callback(userId);
    });
  }

  onUserDisconnected(callback: (userId: string) => void): void {
    if (!this.connection) return;
    
    this.connection.on('UserDisconnected', (userId) => {
      console.log('[SignalR] User disconnected:', userId);
      callback(userId);
    });
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    if (!this.connection) return;
    
    this.connection.on('UserTyping', (data) => {
      console.log('[SignalR] User typing:', data);
      callback(data);
    });
  }

  // ==================== SEND MESSAGES ====================
  
  async sendMessageToUser(toUserId: number, message: string, conversationId: number): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('SendMessageToUser', toUserId.toString(), message, conversationId);
      console.log('[SignalR] Sent message to user:', toUserId);
    } catch (error) {
      console.error('[SignalR] Error sending message:', error);
      throw error;
    }
  }

  async sendMessageToGroup(groupId: number, message: string): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('SendMessageToGroup', groupId, message);
      console.log('[SignalR] Sent message to group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error sending group message:', error);
      throw error;
    }
  }

  // ==================== GROUP MANAGEMENT ====================
  
  async joinGroupChat(groupId: number): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('JoinGroupChat', groupId);
      console.log('[SignalR] Joined group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error joining group:', error);
      throw error;
    }
  }

  async leaveGroupChat(groupId: number): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('LeaveGroupChat', groupId);
      console.log('[SignalR] Left group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error leaving group:', error);
      throw error;
    }
  }

  // ==================== TYPING INDICATOR ====================
  
  async sendTypingIndicator(toUserId: number, isTyping: boolean): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('SendTypingIndicator', toUserId.toString(), isTyping);
    } catch (error) {
      console.error('[SignalR] Error sending typing indicator:', error);
    }
  }

  // ==================== UTILITY ====================
  
  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }
}

export default new SignalRService();
