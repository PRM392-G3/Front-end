import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getAPIUrl } from '../config/api';

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
  private lastToken: string | null = null;
  private manuallyClosed = false;
  private hadConnected = false;
  private reconnecting = false;

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
  this.manuallyClosed = false;
  this.lastToken = token;

    try {
      // Remove /api from URL for SignalR (hubs are at root level)
      let baseUrl = getAPIUrl();
      baseUrl = baseUrl.replace('/api', ''); // Remove /api prefix
      
      const hubUrl = `${baseUrl}/chathub`;
      console.log('[SignalR] Connecting to:', hubUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          withCredentials: true,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
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
        // If disconnect wasn't requested explicitly, try background reconnects
        if (!this.manuallyClosed) {
          console.log('[SignalR] Unexpected close. Scheduling reconnect...');
          this.scheduleReconnect();
        }
      });

      await this.connection.start();
      console.log('[SignalR] Connected successfully');
      this.hadConnected = true;
      this.isConnecting = false;
      this.reconnecting = false;
    } catch (error) {
      console.error('[SignalR] Connection error:', error);
      this.isConnecting = false;
      // If we have previously connected, don't throw — schedule reconnect attempts
      if (this.hadConnected && !this.manuallyClosed) {
        console.log('[SignalR] Connection failed after previous success — scheduling reconnect');
        this.scheduleReconnect();
        return;
      }

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.manuallyClosed = true;
    this.reconnecting = false;
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.warn('[SignalR] Error while stopping connection:', err);
      }
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
    if (!this.connection || this.getConnectionState() !== 'Connected') {
      // If we had a working connection previously, try to reconnect automatically
      if (this.hadConnected && this.lastToken) {
        try {
          console.log('[SignalR] Attempting reconnect before sending message');
          await this.connect(this.lastToken);
        } catch (err) {
          console.warn('[SignalR] Reconnect before send failed:', err);
          throw new Error('Not connected to SignalR hub');
        }
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
  await this.connection!.invoke('SendMessageToUser', toUserId.toString(), message, conversationId);
      console.log('[SignalR] Sent message to user:', toUserId);
    } catch (error) {
      console.error('[SignalR] Error sending message:', error);
      throw error;
    }
  }

  async sendMessageToGroup(groupId: number, message: string): Promise<void> {
    if (!this.connection || this.getConnectionState() !== 'Connected') {
      if (this.hadConnected && this.lastToken) {
        try {
          console.log('[SignalR] Attempting reconnect before sending group message');
          await this.connect(this.lastToken);
        } catch (err) {
          console.warn('[SignalR] Reconnect before send group failed:', err);
          throw new Error('Not connected to SignalR hub');
        }
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
  await this.connection!.invoke('SendMessageToGroup', groupId, message);
      console.log('[SignalR] Sent message to group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error sending group message:', error);
      throw error;
    }
  }

  // ==================== GROUP MANAGEMENT ====================
  
  async joinGroupChat(groupId: number): Promise<void> {
    if (!this.connection || this.getConnectionState() !== 'Connected') {
      if (this.hadConnected && this.lastToken) {
        try {
          console.log('[SignalR] Attempting reconnect before joining group');
          await this.connect(this.lastToken);
        } catch (err) {
          console.warn('[SignalR] Reconnect before join failed:', err);
          throw new Error('Not connected to SignalR hub');
        }
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
  await this.connection!.invoke('JoinGroupChat', groupId);
      console.log('[SignalR] Joined group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error joining group:', error);
      throw error;
    }
  }

  async leaveGroupChat(groupId: number): Promise<void> {
    if (!this.connection || this.getConnectionState() !== 'Connected') {
      if (this.hadConnected && this.lastToken) {
        try {
          console.log('[SignalR] Attempting reconnect before leaving group');
          await this.connect(this.lastToken);
        } catch (err) {
          console.warn('[SignalR] Reconnect before leave failed:', err);
          throw new Error('Not connected to SignalR hub');
        }
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
  await this.connection!.invoke('LeaveGroupChat', groupId);
      console.log('[SignalR] Left group:', groupId);
    } catch (error) {
      console.error('[SignalR] Error leaving group:', error);
      throw error;
    }
  }

  // ==================== TYPING INDICATOR ====================
  
  async sendTypingIndicator(toUserId: number, isTyping: boolean): Promise<void> {
    if (!this.connection || this.getConnectionState() !== 'Connected') {
      if (this.hadConnected && this.lastToken) {
        try {
          console.log('[SignalR] Attempting reconnect before sending typing indicator');
          await this.connect(this.lastToken);
        } catch (err) {
          console.warn('[SignalR] Reconnect before typing failed:', err);
          throw new Error('Not connected to SignalR hub');
        }
      } else {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
  await this.connection!.invoke('SendTypingIndicator', toUserId.toString(), isTyping);
    } catch (error) {
      console.error('[SignalR] Error sending typing indicator:', error);
    }
  }

  // ==================== UTILITY ====================

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private async scheduleReconnect() {
    if (this.reconnecting) return;
    if (!this.lastToken) {
      console.log('[SignalR] No token available for reconnect, aborting');
      return;
    }
    this.reconnecting = true;
    console.log('[SignalR] Beginning reconnect loop');
    let attempt = 0;
    while (!this.manuallyClosed) {
      attempt++;
      const backoff = Math.min(60000, 2000 * Math.pow(2, Math.min(attempt, 6))); // 2s,4s,8s.. up to 60s
      try {
        console.log(`[SignalR] Reconnect attempt #${attempt} (waiting ${backoff}ms)`);
        // If connection object exists, try to start it, otherwise call connect to rebuild
        if (this.connection) {
          if (this.getConnectionState() !== 'Connected') {
            await this.connection.start();
            console.log('[SignalR] Reconnected existing connection');
            this.hadConnected = true;
            break;
          } else {
            console.log('[SignalR] Connection already re-established');
            break;
          }
        } else {
          // Attempt to create a fresh connection using the stored token
          await this.connect(this.lastToken as string);
          if (this.getConnectionState() === 'Connected') {
            console.log('[SignalR] Reconnected by rebuilding connection');
            break;
          }
        }
      } catch (err) {
        console.warn('[SignalR] Reconnect attempt failed:', err);
        // wait before next attempt with slight jitter
        const jitter = Math.floor(Math.random() * 1000);
        await this.sleep(backoff + jitter);
        continue;
      }
    }
    this.reconnecting = false;
  }
  
  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }
}

export default new SignalRService();
