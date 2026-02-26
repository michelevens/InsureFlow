import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Badge, Modal } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';
import { messagingService, type Conversation, type ConversationUser } from '@/services/api/messaging';
import {
  MessageSquare, Send, Search, Plus, Users, Check, CheckCheck,
  ArrowLeft, Circle,
} from 'lucide-react';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const roleColors: Record<string, string> = {
  consumer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  agent: 'bg-teal-100 text-teal-700',
  agency_owner: 'bg-purple-100 text-purple-700 dark:text-purple-300',
  carrier: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  superadmin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function Messages() {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [composeBody, setComposeBody] = useState('');
  const [composeTo, setComposeTo] = useState<ConversationUser | null>(null);
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversations, messages, isOtherTyping,
    loadingConvs, loadingMsgs, totalUnread,
    sendMessage, sendTyping, fetchConversations,
  } = useRealTimeMessages(activeConvId);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Focus input when switching conversations
  useEffect(() => {
    if (activeConvId) inputRef.current?.focus();
  }, [activeConvId]);

  const handleSend = useCallback(async () => {
    const body = inputValue.trim();
    if (!body) return;
    setInputValue('');
    await sendMessage(body);
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    sendTyping();
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setActiveConvId(null);
  };

  // Compose: search users
  useEffect(() => {
    if (!showCompose) return;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await messagingService.searchUsers(composeSearch || undefined);
        setSearchResults(res.users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [composeSearch, showCompose]);

  const handleComposeSend = async () => {
    if (!composeTo || !composeBody.trim()) return;
    setSending(true);
    try {
      const res = await messagingService.startConversation({
        recipient_id: composeTo.id,
        body: composeBody.trim(),
      });
      setShowCompose(false);
      setComposeTo(null);
      setComposeBody('');
      setComposeSearch('');
      fetchConversations();
      setActiveConvId(res.conversation.id);
      setMobileShowChat(true);
    } catch {
      // error handled silently
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const messageGroups: { date: string; msgs: typeof messages }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString();
    if (d !== currentDate) {
      currentDate = d;
      messageGroups.push({ date: msg.created_at, msgs: [] });
    }
    messageGroups[messageGroups.length - 1].msgs.push(msg);
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-white dark:bg-slate-900 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Messages
              {totalUnread > 0 && (
                <Badge variant="danger" size="sm">{totalUnread}</Badge>
              )}
            </h1>
            <Button variant="shield" size="sm" onClick={() => setShowCompose(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-teal-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">No conversations yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Start a conversation to get going</p>
              <Button variant="shield" size="sm" className="mt-4" onClick={() => setShowCompose(true)}>
                New Message
              </Button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-700/50 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors ${
                  activeConvId === conv.id ? 'bg-teal-50 dark:bg-teal-900/30 border-l-2 border-l-teal-500' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {conv.other_user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white truncate">{conv.other_user.name}</span>
                    {conv.last_message_at && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColors[conv.other_user.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {conv.other_user.role.replace('_', ' ')}
                    </span>
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{conv.last_message}</p>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs text-white font-medium">{conv.unread_count}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-800 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
              <button onClick={handleBack} className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                {activeConv.other_user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{activeConv.other_user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColors[activeConv.other_user.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {activeConv.other_user.role.replace('_', ' ')}
                  </span>
                  {isOtherTyping && (
                    <span className="text-xs text-teal-600 animate-pulse">typing...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  No messages yet. Say hello!
                </div>
              ) : (
                messageGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
                        {formatDateSeparator(group.date)}
                      </div>
                    </div>
                    {group.msgs.map((msg) => {
                      const isMe = msg.sender_id === user?.id || msg.sender_id === -1;
                      return (
                        <div key={msg.id} className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-teal-600 text-white rounded-br-md'
                              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-teal-200' : 'text-slate-400 dark:text-slate-500'}`}>
                              <span className="text-[10px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                msg.read_at
                                  ? <CheckCheck className="w-3.5 h-3.5" />
                                  : <Check className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {isOtherTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <Circle className="w-2 h-2 text-slate-400 dark:text-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <Circle className="w-2 h-2 text-slate-400 dark:text-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <Circle className="w-2 h-2 text-slate-400 dark:text-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <Button
                  variant="shield"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-teal-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select a Conversation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Choose an existing conversation or start a new one to begin messaging.
            </p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={showCompose}
        onClose={() => { setShowCompose(false); setComposeTo(null); setComposeBody(''); setComposeSearch(''); }}
        title="New Message"
      >
        <div className="space-y-4">
          {!composeTo ? (
            <>
              <Input
                label="Search users"
                placeholder="Name or email..."
                value={composeSearch}
                onChange={(e) => setComposeSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No users found</p>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setComposeTo(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500">{u.email}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColors[u.role] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100">
                <Users className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-teal-900">To: {composeTo.name}</p>
                  <p className="text-xs text-teal-600">{composeTo.role.replace('_', ' ')}</p>
                </div>
                <button onClick={() => setComposeTo(null)} className="ml-auto text-teal-500 hover:text-teal-700">
                  &times;
                </button>
              </div>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
              <Button
                variant="shield"
                className="w-full"
                onClick={handleComposeSend}
                disabled={!composeBody.trim()}
                isLoading={sending}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
