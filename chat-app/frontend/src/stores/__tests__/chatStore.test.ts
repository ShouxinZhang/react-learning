import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';
import type { ChatWithLastMessage } from '../../services/chatService';

vi.mock('../../services/chatService', () => ({
  chatService: {
    getChats: vi.fn(),
  },
}));

import { chatService } from '../../services/chatService';

const makeChat = (id: number, createdAt = '2026-03-28T10:00:00Z'): ChatWithLastMessage => ({
  id,
  type: 'private',
  name: `Chat ${id}`,
  avatar_url: null,
  created_at: createdAt,
  last_message: null,
  members: [],
});

const initialState = {
  chats: [],
  currentChatId: null,
  loading: false,
  unreadCounts: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState(initialState);
});

describe('chatStore', () => {
  it('fetchChats success', async () => {
    const chats = [makeChat(1), makeChat(2)];
    vi.mocked(chatService.getChats).mockResolvedValue(chats);

    await useChatStore.getState().fetchChats();

    expect(useChatStore.getState().chats).toEqual(chats);
    expect(useChatStore.getState().loading).toBe(false);
  });

  it('setCurrentChat + clearUnread', () => {
    useChatStore.setState({ unreadCounts: { 1: 3, 2: 5 } });

    useChatStore.getState().setCurrentChat(1);

    expect(useChatStore.getState().currentChatId).toBe(1);
    expect(useChatStore.getState().unreadCounts[1]).toBeUndefined();
    expect(useChatStore.getState().unreadCounts[2]).toBe(5);
  });

  it('addChat does not duplicate', () => {
    const chat = makeChat(1);
    useChatStore.setState({ chats: [chat] });

    useChatStore.getState().addChat(chat);

    expect(useChatStore.getState().chats).toHaveLength(1);
  });

  it('addChat prepends new chat', () => {
    const chat1 = makeChat(1);
    useChatStore.setState({ chats: [chat1] });

    const chat2 = makeChat(2);
    useChatStore.getState().addChat(chat2);

    expect(useChatStore.getState().chats).toHaveLength(2);
    expect(useChatStore.getState().chats[0].id).toBe(2);
  });

  it('updateLastMessage sorts by time', () => {
    const chat1 = makeChat(1, '2026-03-28T09:00:00Z');
    const chat2 = makeChat(2, '2026-03-28T10:00:00Z');
    useChatStore.setState({ chats: [chat2, chat1] });

    // Update chat1 with newer message → should move to top
    useChatStore.getState().updateLastMessage(1, {
      id: 100,
      chat_id: 1,
      sender_id: 1,
      content: 'Hello',
      type: 'text',
      created_at: '2026-03-28T11:00:00Z',
    });

    const chats = useChatStore.getState().chats;
    expect(chats[0].id).toBe(1);
    expect(chats[0].last_message?.content).toBe('Hello');
  });

  it('incrementUnread increments count', () => {
    useChatStore.getState().incrementUnread(1);
    useChatStore.getState().incrementUnread(1);
    useChatStore.getState().incrementUnread(2);

    expect(useChatStore.getState().unreadCounts[1]).toBe(2);
    expect(useChatStore.getState().unreadCounts[2]).toBe(1);
  });

  it('clearUnread removes the count', () => {
    useChatStore.setState({ unreadCounts: { 1: 5, 2: 3 } });

    useChatStore.getState().clearUnread(1);

    expect(useChatStore.getState().unreadCounts[1]).toBeUndefined();
    expect(useChatStore.getState().unreadCounts[2]).toBe(3);
  });
});
