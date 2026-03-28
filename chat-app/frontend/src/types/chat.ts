import type { User } from './user';
import type { Message } from './message';

export type ChatType = 'private' | 'group';

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  members?: User[];
  last_message?: Message | null;
  unread_count?: number;
}
