import { api } from './client';

export interface ConversationUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Conversation {
  id: number;
  other_user: ConversationUser;
  context_type: string | null;
  context_id: number | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  body: string;
  type: 'text' | 'attachment' | 'system';
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
}

export const messagingService = {
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return api.get('/conversations');
  },

  async startConversation(data: {
    recipient_id: number;
    body: string;
    context_type?: string;
    context_id?: number;
  }): Promise<{ conversation: Conversation; message: ChatMessage }> {
    return api.post('/conversations', data);
  },

  async searchUsers(query?: string): Promise<{ users: ConversationUser[] }> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return api.get(`/conversations/users${q}`);
  },

  async getMessages(conversationId: number): Promise<{ messages: ChatMessage[] }> {
    return api.get(`/conversations/${conversationId}/messages`);
  },

  async getNewMessages(conversationId: number, afterId: number): Promise<{ messages: ChatMessage[] }> {
    return api.get(`/conversations/${conversationId}/new-messages?after=${afterId}`);
  },

  async sendMessage(conversationId: number, body: string): Promise<{ message: ChatMessage }> {
    return api.post(`/conversations/${conversationId}/messages`, { body });
  },

  async sendTyping(conversationId: number): Promise<void> {
    return api.post(`/conversations/${conversationId}/typing`);
  },

  async getTypingStatus(conversationId: number): Promise<{ is_typing: boolean }> {
    return api.get(`/conversations/${conversationId}/typing`);
  },

  async markRead(messageId: number): Promise<void> {
    return api.put(`/messages/${messageId}/read`);
  },
};
