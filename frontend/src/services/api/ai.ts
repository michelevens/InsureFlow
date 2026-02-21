import { api } from './client';

export interface AiConversation {
  id: string;
  title: string | null;
  message_count: number;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AiChatResponse {
  conversation_id: string;
  message: AiMessage;
  daily_count: number;
  daily_limit: number;
}

export const aiService = {
  async getConversations(): Promise<AiConversation[]> {
    return api.get<AiConversation[]>('/ai/conversations');
  },

  async getMessages(conversationId: string): Promise<AiMessage[]> {
    return api.get<AiMessage[]>(`/ai/conversations/${conversationId}/messages`);
  },

  async chat(message: string, conversationId?: string, contextPage?: string): Promise<AiChatResponse> {
    return api.post<AiChatResponse>('/ai/chat', {
      message,
      conversation_id: conversationId || undefined,
      context_page: contextPage || undefined,
    });
  },

  async getSuggestions(page?: string): Promise<{ suggestions: string[] }> {
    const params = page ? `?page=${encodeURIComponent(page)}` : '';
    return api.get<{ suggestions: string[] }>(`/ai/suggestions${params}`);
  },

  async deleteConversation(conversationId: string): Promise<void> {
    return api.delete(`/ai/conversations/${conversationId}`);
  },
};
