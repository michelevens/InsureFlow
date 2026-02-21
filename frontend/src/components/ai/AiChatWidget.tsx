import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { aiService } from '@/services/api/ai';
import type { AiConversation, AiMessage } from '@/services/api/ai';
import {
  Bot, X, Send, MessageSquare, Trash2, ArrowLeft, Sparkles, Loader2,
} from 'lucide-react';

type View = 'chat' | 'history';

export function AiChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('chat');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dailyInfo, setDailyInfo] = useState<{ count: number; limit: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextPage = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';

  // Load suggestions when widget opens
  useEffect(() => {
    if (open && suggestions.length === 0) {
      aiService.getSuggestions(contextPage).then(r => setSuggestions(r.suggestions)).catch(() => {});
    }
  }, [open, contextPage, suggestions.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const convos = await aiService.getConversations();
      setConversations(convos);
    } catch { /* ignore */ }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const msgs = await aiService.getMessages(id);
      setMessages(msgs);
      setConversationId(id);
      setView('chat');
    } catch { /* ignore */ }
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setView('chat');
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;

    setInput('');
    setSending(true);

    // Optimistic user message
    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await aiService.chat(msg, conversationId || undefined, contextPage);
      setConversationId(response.conversation_id);
      setMessages(prev => [...prev, response.message]);
      setDailyInfo({ count: response.daily_count, limit: response.daily_limit });
    } catch (err) {
      const errorMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error && err.message.includes('429')
          ? 'You\'ve reached your daily AI message limit. Upgrade your plan for more.'
          : 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await aiService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) handleNewChat();
    } catch { /* ignore */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-shield-600 to-confidence-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        title="Insurons AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-shield-600 to-confidence-600 text-white">
        <div className="flex items-center gap-2">
          {view === 'history' && (
            <button onClick={() => setView('chat')} className="p-1 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {view === 'history' ? 'Chat History' : 'Insurons AI'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {view === 'chat' && (
            <>
              <button
                onClick={() => { loadConversations(); setView('history'); }}
                className="p-1.5 hover:bg-white/20 rounded-lg"
                title="Chat history"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button onClick={handleNewChat} className="p-1.5 hover:bg-white/20 rounded-lg" title="New chat">
                <Sparkles className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {view === 'history' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-8">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group"
                onClick={() => loadConversation(c.id)}
              >
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.title || 'Untitled'}</p>
                  <p className="text-xs text-slate-400">{c.message_count} messages</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-4 mt-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-shield-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-shield-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">How can I help you today?</p>
                  <p className="text-xs text-slate-400 mt-1">Ask me anything about insurance</p>
                </div>
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-shield-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-shield-600 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-700 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            {dailyInfo && (
              <p className="text-xs text-slate-400 mb-2 text-center">
                {dailyInfo.count}/{dailyInfo.limit} messages today
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about insurance..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-shield-600 text-white hover:bg-shield-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
