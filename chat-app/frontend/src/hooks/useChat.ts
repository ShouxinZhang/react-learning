import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useMessageStore } from '../stores/messageStore';
import { useChatStore } from '../stores/chatStore';
import { setTyping } from './useTypingIndicator';
import { usePresenceStore } from '../stores/presenceStore';

export function useChat() {
  const { send } = useWebSocket((data) => {
    if (data.type === 'new_message') {
      const msg = data.message;
      useMessageStore.getState().addMessage(msg.chat_id, msg);
      useChatStore.getState().updateLastMessage(msg.chat_id, msg);
      if (msg.chat_id !== useChatStore.getState().currentChatId) {
        useChatStore.getState().incrementUnread(msg.chat_id);
      }
    }
    if (data.type === 'typing') {
      setTyping(data.chat_id, data.user_id);
    }
    if (data.type === 'presence') {
      if (data.online) {
        usePresenceStore.getState().setOnline(data.user_id);
      } else {
        usePresenceStore.getState().setOffline(data.user_id);
      }
    }
    if (data.type === 'online_users') {
      usePresenceStore.getState().setOnlineUsers(data.user_ids);
    }
  });

  const sendMessage = useCallback((chatId: number, content: string) => {
    send({ type: 'message', chat_id: chatId, content });
  }, [send]);

  const sendTyping = useCallback((chatId: number) => {
    send({ type: 'typing', chat_id: chatId });
  }, [send]);

  return { sendMessage, sendTyping };
}
