import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMessageStore } from '../messageStore';
import type { Message } from '../../types';

vi.mock('../../services/messageService', () => ({
  messageService: {
    getMessages: vi.fn(),
  },
}));

import { messageService } from '../../services/messageService';

const makeMsg = (id: number, chatId = 1): Message => ({
  id,
  chat_id: chatId,
  sender_id: 1,
  content: `msg-${id}`,
  type: 'text',
  created_at: `2026-03-28T10:${String(id).padStart(2, '0')}:00Z`,
});

const initialState = {
  messagesByChat: {},
  hasMore: {},
  loading: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useMessageStore.setState(initialState);
});

describe('messageStore', () => {
  it('fetchHistory stores reversed messages', async () => {
    // API returns newest-first, store reverses to oldest-first
    const msgs = [makeMsg(3), makeMsg(2), makeMsg(1)];
    vi.mocked(messageService.getMessages).mockResolvedValue(msgs);

    await useMessageStore.getState().fetchHistory(1);

    const stored = useMessageStore.getState().messagesByChat[1];
    expect(stored).toHaveLength(3);
    expect(stored[0].id).toBe(1);
    expect(stored[2].id).toBe(3);
    expect(useMessageStore.getState().loading).toBe(false);
  });

  it('fetchHistory sets hasMore when >= 20 messages', async () => {
    const msgs = Array.from({ length: 20 }, (_, i) => makeMsg(20 - i));
    vi.mocked(messageService.getMessages).mockResolvedValue(msgs);

    await useMessageStore.getState().fetchHistory(1);

    expect(useMessageStore.getState().hasMore[1]).toBe(true);
  });

  it('fetchHistory sets hasMore=false when < 20 messages', async () => {
    vi.mocked(messageService.getMessages).mockResolvedValue([makeMsg(1)]);

    await useMessageStore.getState().fetchHistory(1);

    expect(useMessageStore.getState().hasMore[1]).toBe(false);
  });

  it('loadMore prepends older messages', async () => {
    // Setup: existing messages id=5..7
    useMessageStore.setState({
      messagesByChat: { 1: [makeMsg(5), makeMsg(6), makeMsg(7)] },
      hasMore: { 1: true },
      loading: false,
    });

    const older = [makeMsg(4), makeMsg(3)];
    vi.mocked(messageService.getMessages).mockResolvedValue(older);

    await useMessageStore.getState().loadMore(1);

    const stored = useMessageStore.getState().messagesByChat[1];
    // older reversed = [3,4] prepended before [5,6,7]
    expect(stored[0].id).toBe(3);
    expect(stored[1].id).toBe(4);
    expect(stored[2].id).toBe(5);
    expect(messageService.getMessages).toHaveBeenCalledWith(1, 5);
  });

  it('loadMore does nothing when hasMore is false', async () => {
    useMessageStore.setState({
      messagesByChat: { 1: [makeMsg(1)] },
      hasMore: { 1: false },
      loading: false,
    });

    await useMessageStore.getState().loadMore(1);

    expect(messageService.getMessages).not.toHaveBeenCalled();
  });

  it('addMessage appends to existing messages', () => {
    useMessageStore.setState({
      messagesByChat: { 1: [makeMsg(1)] },
      hasMore: {},
      loading: false,
    });

    const newMsg = makeMsg(2);
    useMessageStore.getState().addMessage(1, newMsg);

    const stored = useMessageStore.getState().messagesByChat[1];
    expect(stored).toHaveLength(2);
    expect(stored[1].id).toBe(2);
  });

  it('addMessage creates array for new chat', () => {
    useMessageStore.getState().addMessage(99, makeMsg(1, 99));

    expect(useMessageStore.getState().messagesByChat[99]).toHaveLength(1);
  });
});
