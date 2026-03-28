import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import type { ChatWithLastMessage } from '../../services/chatService';
import styles from './ChatList.module.css';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function getChatDisplay(chat: ChatWithLastMessage, myUserId: number) {
  if (chat.type === 'private') {
    const other = chat.members.find((m) => m.id !== myUserId);
    if (other) {
      return { name: other.nickname || other.username, avatar: other.avatar_url };
    }
  }
  return { name: chat.name || '群聊', avatar: chat.avatar_url };
}

export function ChatList() {
  const { chats, currentChatId, loading, fetchChats, setCurrentChat, unreadCounts } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  if (loading && chats.length === 0) {
    return <div className={styles.empty}>加载中…</div>;
  }

  if (chats.length === 0) {
    return <div className={styles.empty}>暂无聊天</div>;
  }

  return (
    <div className={styles.list}>
      {chats.map((chat) => {
        const display = getChatDisplay(chat, user?.id ?? -1);
        const isSelected = chat.id === currentChatId;
        const isOnline =
          chat.type === 'private'
            ? (() => {
                const other = chat.members.find((m) => m.id !== (user?.id ?? -1));
                return other ? onlineUsers.has(other.id) : false;
              })()
            : undefined;

        return (
          <div
            key={chat.id}
            className={`${styles.item} ${isSelected ? styles.selected : ''}`}
            onClick={() => setCurrentChat(chat.id)}
          >
            <UserAvatar src={display.avatar} name={display.name} size="md" online={isOnline} />
            <div className={styles.info}>
              <div className={styles.topRow}>
                <span className={styles.name}>
                  {chat.type === 'group' && <span className={styles.groupBadge}>群</span>}
                  {display.name}
                </span>
                {chat.last_message && (
                  <span className={styles.time}>
                    {formatTime(chat.last_message.created_at)}
                  </span>
                )}
              </div>
              <div className={styles.lastMessage}>
                {chat.last_message ? truncate(chat.last_message.content, 30) : ''}
              </div>
            </div>
            {(unreadCounts[chat.id] ?? 0) > 0 && (
              <span className={styles.badge}>
                {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ChatList;
