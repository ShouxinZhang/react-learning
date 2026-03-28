export type OnlineStatus = 'online' | 'offline';

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  online_status?: OnlineStatus;
}
