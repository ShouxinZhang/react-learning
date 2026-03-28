import React, { useCallback, useEffect, useRef } from 'react';
import { useMessageStore } from '../../stores/messageStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { globalSend } from '../../hooks/useWebSocket';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { shouldShowTimeSeparator, formatDateSeparator } from '../../utils/formatTime';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { MessageInput } from '../MessageInput/MessageInput';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  chatId: number | null;
  onBack?: () => void;
}

const EMPTY_MESSAGES: never[] = [];

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const typingUsers = useTypingIndicator(chatId);
  const user = useAuthStore((s) => s.user);
  const chats = useChatStore((s) => s.chats);
  const messages = useMessageStore((s) =>
    chatId ? s.messagesByChat[chatId] || EMPTY_MESSAGES : EMPTY_MESSAGES
  );
  const hasMore = useMessageStore((s) =>
    chatId ? s.hasMore[chatId] ?? false : false
  );
  const loading = useMessageStore((s) => s.loading);
  const fetchHistory = useMessageStore((s) => s.fetchHistory);
  const loadMore = useMessageStore((s) => s.loadMore);

  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Fetch history when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchHistory(chatId);
    }
  }, [chatId, fetchHistory]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const el = listRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const handleSend = useCallback((content: string) => {
    if (chatId) globalSend({ type: 'message', chat_id: chatId, content });
  }, [chatId]);

  const handleTyping = useCallback(() => {
    if (chatId) globalSend({ type: 'typing', chat_id: chatId });
  }, [chatId]);

  if (chatId === null) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>选择一个会话开始聊天</div>
      </div>
    );
  }

  const chat = chats.find((c) => c.id === chatId);
  const chatName = chat?.name || '会话';
  const isGroup = chat?.type === 'group';
  const memberCount = chat?.members?.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>← 返回</button>
        )}
        <span>{chatName}</span>
        {isGroup && memberCount && (
          <span className={styles.memberCount}>({memberCount})</span>
        )}
      </div>

      <div className={styles.messageList} ref={listRef}>
        {hasMore && (
          <button
            className={styles.loadMore}
            disabled={loading}
            onClick={() => loadMore(chatId)}
          >
            {loading ? '加载中…' : '加载更多'}
          </button>
        )}
        {messages.map((msg, i) => {
          const prevTime = i > 0 ? messages[i - 1].created_at : null;
          const showSep = shouldShowTimeSeparator(prevTime, msg.created_at);
          return (
            <React.Fragment key={msg.id}>
              {showSep && (
                <div className={styles.timeSeparator}>
                  {formatDateSeparator(msg.created_at)}
                </div>
              )}
              <MessageBubble
                message={msg}
                isMine={msg.sender_id === user?.id}
                showSender={isGroup}
              />
            </React.Fragment>
          );
        })}
      </div>

      {typingUsers.length > 0 && (
        <div className={styles.typingIndicator}>对方正在输入...</div>
      )}
      <div className={styles.inputArea}>
        <MessageInput onSend={handleSend} onTyping={handleTyping} />
      </div>
    </div>
  );
}

export default ChatWindow;
