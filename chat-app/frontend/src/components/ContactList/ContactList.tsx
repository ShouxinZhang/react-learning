import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../../services/chatService';
import { useChatStore } from '../../stores/chatStore';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import type { User } from '../../types';
import styles from './ContactList.module.css';

export function ContactList() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { addChat, setCurrentChat } = useChatStore();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await chatService.searchUsers(q);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  const handleSelect = async (user: User) => {
    try {
      const chat = await chatService.createPrivateChat(user.id);
      addChat(chat);
      setCurrentChat(chat.id);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          placeholder="搜索用户…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className={styles.results}>
        {searching && <div className={styles.hint}>搜索中…</div>}
        {!searching && query && results.length === 0 && (
          <div className={styles.hint}>未找到用户</div>
        )}
        {!searching && !query && (
          <div className={styles.hint}>输入用户名搜索联系人</div>
        )}
        {results.map((user) => (
          <div key={user.id} className={styles.item} onClick={() => handleSelect(user)}>
            <UserAvatar src={user.avatar_url} name={user.nickname || user.username} size="md" />
            <div className={styles.userInfo}>
              <span className={styles.nickname}>{user.nickname}</span>
              <span className={styles.username}>@{user.username}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContactList;
