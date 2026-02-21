import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingService, type Conversation, type ChatMessage } from '@/services/api/messaging';

const ACTIVE_POLL_INTERVAL = 3000;
const IDLE_POLL_INTERVAL = 15000;
const CONV_ACTIVE_POLL = 10000;
const CONV_IDLE_POLL = 30000;
const TYPING_DEBOUNCE = 2000;
const TYPING_POLL = 2000;
const TYPING_EXPIRY = 4000;

export function useRealTimeMessages(activeConversationId: number | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const isActiveRef = useRef(true);
  const lastMessageIdRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typingExpiryRef = useRef<ReturnType<typeof setTimeout>>();
  const msgPollRef = useRef<ReturnType<typeof setInterval>>();
  const convPollRef = useRef<ReturnType<typeof setInterval>>();
  const typingPollRef = useRef<ReturnType<typeof setInterval>>();

  // Track window focus
  useEffect(() => {
    const onFocus = () => { isActiveRef.current = true; };
    const onBlur = () => { isActiveRef.current = false; };
    const onVisChange = () => {
      isActiveRef.current = document.visibilityState === 'visible';
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await messagingService.getConversations();
      setConversations(res.conversations);
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Fetch full message history for active conversation
  const fetchMessages = useCallback(async (convId: number) => {
    setLoadingMsgs(true);
    try {
      const res = await messagingService.getMessages(convId);
      setMessages(res.messages);
      if (res.messages.length > 0) {
        lastMessageIdRef.current = res.messages[res.messages.length - 1].id;
      } else {
        lastMessageIdRef.current = 0;
      }
    } catch {
      // silent
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // Poll for new messages (incremental)
  const pollNewMessages = useCallback(async () => {
    if (!activeConversationId || !isActiveRef.current) return;
    try {
      const res = await messagingService.getNewMessages(
        activeConversationId,
        lastMessageIdRef.current,
      );
      if (res.messages.length > 0) {
        setMessages((prev) => [...prev, ...res.messages]);
        lastMessageIdRef.current = res.messages[res.messages.length - 1].id;
        // Refresh conversation list to update last_message/unread
        fetchConversations();
      }
    } catch {
      // silent
    }
  }, [activeConversationId, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // When active conversation changes, load messages
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      setIsOtherTyping(false);
    } else {
      setMessages([]);
      lastMessageIdRef.current = 0;
    }
  }, [activeConversationId, fetchMessages]);

  // Message polling
  useEffect(() => {
    if (!activeConversationId) return;

    const startPoll = () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
      const interval = isActiveRef.current ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;
      msgPollRef.current = setInterval(pollNewMessages, interval);
    };

    startPoll();
    const focusHandler = () => startPoll();
    window.addEventListener('focus', focusHandler);

    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
      window.removeEventListener('focus', focusHandler);
    };
  }, [activeConversationId, pollNewMessages]);

  // Conversation list polling
  useEffect(() => {
    const startPoll = () => {
      if (convPollRef.current) clearInterval(convPollRef.current);
      const interval = isActiveRef.current ? CONV_ACTIVE_POLL : CONV_IDLE_POLL;
      convPollRef.current = setInterval(fetchConversations, interval);
    };

    startPoll();
    const focusHandler = () => startPoll();
    window.addEventListener('focus', focusHandler);

    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current);
      window.removeEventListener('focus', focusHandler);
    };
  }, [fetchConversations]);

  // Typing indicator polling
  useEffect(() => {
    if (!activeConversationId) return;

    typingPollRef.current = setInterval(async () => {
      if (!isActiveRef.current) return;
      try {
        const res = await messagingService.getTypingStatus(activeConversationId);
        if (res.is_typing) {
          setIsOtherTyping(true);
          if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
          typingExpiryRef.current = setTimeout(() => setIsOtherTyping(false), TYPING_EXPIRY);
        }
      } catch {
        // silent
      }
    }, TYPING_POLL);

    return () => {
      if (typingPollRef.current) clearInterval(typingPollRef.current);
      if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
    };
  }, [activeConversationId]);

  // Send typing signal (debounced)
  const sendTyping = useCallback(() => {
    if (!activeConversationId) return;
    if (typingTimeoutRef.current) return; // Already sent recently

    messagingService.sendTyping(activeConversationId).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = undefined;
    }, TYPING_DEBOUNCE);
  }, [activeConversationId]);

  // Optimistic send
  const sendMessage = useCallback(async (body: string) => {
    if (!activeConversationId) return;

    // Optimistic update
    const tempId = Date.now();
    const tempMsg: ChatMessage = {
      id: tempId,
      sender_id: -1, // will be replaced
      body,
      type: 'text',
      attachment_url: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await messagingService.sendMessage(activeConversationId, body);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.message : m)),
      );
      lastMessageIdRef.current = res.message.id;
      fetchConversations();
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [activeConversationId, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return {
    conversations,
    messages,
    isOtherTyping,
    loadingConvs,
    loadingMsgs,
    totalUnread,
    sendMessage,
    sendTyping,
    fetchConversations,
    setMessages,
  };
}
