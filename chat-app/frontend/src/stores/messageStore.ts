import { create } from 'zustand';
import type { Message } from '../types';
import { messageService } from '../services/messageService';

interface MessageState {
  messagesByChat: Record<number, Message[]>;
  hasMore: Record<number, boolean>;
  loading: boolean;

  fetchHistory: (chatId: number) => Promise<void>;
  loadMore: (chatId: number) => Promise<void>;
  addMessage: (chatId: number, message: Message) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByChat: {},
  hasMore: {},
  loading: false,

  fetchHistory: async (chatId) => {
    set({ loading: true });
    try {
      const messages = await messageService.getMessages(chatId);
      set({
        messagesByChat: { ...get().messagesByChat, [chatId]: messages.reverse() },
        hasMore: { ...get().hasMore, [chatId]: messages.length >= 20 },
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  loadMore: async (chatId) => {
    const existing = get().messagesByChat[chatId] || [];
    if (existing.length === 0 || !get().hasMore[chatId]) return;

    const oldestId = existing[0].id;
    set({ loading: true });
    try {
      const older = await messageService.getMessages(chatId, oldestId);
      set({
        messagesByChat: {
          ...get().messagesByChat,
          [chatId]: [...older.reverse(), ...existing],
        },
        hasMore: { ...get().hasMore, [chatId]: older.length >= 20 },
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  addMessage: (chatId, message) => {
    const existing = get().messagesByChat[chatId] || [];
    set({
      messagesByChat: {
        ...get().messagesByChat,
        [chatId]: [...existing, message],
      },
    });
  },
}));
