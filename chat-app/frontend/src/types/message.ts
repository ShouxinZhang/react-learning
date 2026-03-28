export type MessageType = 'text' | 'image' | 'system';

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  type: MessageType;
  created_at: string;
  sender_nickname?: string;
}
