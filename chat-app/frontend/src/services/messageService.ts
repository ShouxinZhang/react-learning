import { api } from './api';
import type { Message } from '../types';

export const messageService = {
  getMessages: (chatId: number, before?: number, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', String(before));
    return api.get<Message[]>(`/chats/${chatId}/messages?${params}`);
  },
};
