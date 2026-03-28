import { api } from './api';
import type { User } from '../types';

export interface ChatWithLastMessage {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_message: {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    type: string;
    created_at: string;
    sender_nickname?: string;
  } | null;
  members: User[];
}

export const chatService = {
  getChats: () => api.get<ChatWithLastMessage[]>('/chats'),
  createPrivateChat: (userId: number) =>
    api.post<ChatWithLastMessage>('/chats', { user_id: userId }),
  searchUsers: (query: string) =>
    api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
  createGroup: (name: string, memberIds: number[]) =>
    api.post<ChatWithLastMessage>('/chats/group', { name, member_ids: memberIds }),
  getMembers: (chatId: number) =>
    api.get<Array<{ user: User; role: string }>>(`/chats/${chatId}/members`),
  addMembers: (chatId: number, userIds: number[]) =>
    api.post<{ added: number }>(`/chats/${chatId}/members`, { user_ids: userIds }),
  removeMember: (chatId: number, userId: number) =>
    api.delete<{ removed: boolean }>(`/chats/${chatId}/members/${userId}`),
};
