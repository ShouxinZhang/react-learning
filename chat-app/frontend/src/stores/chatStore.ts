import { create } from 'zustand';
import { chatService, type ChatWithLastMessage } from '../services/chatService';

interface ChatState {
  chats: ChatWithLastMessage[];
  currentChatId: number | null;
  loading: boolean;
  unreadCounts: Record<number, number>;
  fetchChats: () => Promise<void>;
  setCurrentChat: (chatId: number | null) => void;
  addChat: (chat: ChatWithLastMessage) => void;
  updateLastMessage: (chatId: number, message: ChatWithLastMessage['last_message']) => void;
  incrementUnread: (chatId: number) => void;
  clearUnread: (chatId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  loading: false,
  unreadCounts: {},

  fetchChats: async () => {
    set({ loading: true });
    try {
      const chats = await chatService.getChats();
      set({ chats, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setCurrentChat: (chatId) => {
    set({ currentChatId: chatId });
    if (chatId !== null) {
      const { [chatId]: _, ...rest } = get().unreadCounts;
      set({ unreadCounts: rest });
    }
  },

  addChat: (chat) => {
    const exists = get().chats.find((c) => c.id === chat.id);
    if (!exists) {
      set({ chats: [chat, ...get().chats] });
    }
  },

  incrementUnread: (chatId) => {
    const counts = get().unreadCounts;
    set({ unreadCounts: { ...counts, [chatId]: (counts[chatId] || 0) + 1 } });
  },

  clearUnread: (chatId) => {
    const { [chatId]: _, ...rest } = get().unreadCounts;
    set({ unreadCounts: rest });
  },

  updateLastMessage: (chatId, message) => {
    set({
      chats: get()
        .chats.map((c) =>
          c.id === chatId ? { ...c, last_message: message } : c,
        )
        .sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }),
    });
  },
}));
