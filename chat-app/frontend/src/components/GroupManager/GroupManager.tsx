import { useState, useCallback } from 'react';
import { chatService } from '../../services/chatService';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import type { User } from '../../types';
import styles from './GroupManager.module.css';

interface GroupManagerProps {
  mode: 'create' | 'manage';
  chatId?: number;
  onClose: () => void;
}

export function GroupManager({ mode, chatId, onClose }: GroupManagerProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {mode === 'create' ? (
          <CreateMode onClose={onClose} />
        ) : (
          <ManageMode chatId={chatId!} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function CreateMode({ onClose }: { onClose: () => void }) {
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const addChat = useChatStore((s) => s.addChat);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const users = await chatService.searchUsers(query.trim());
      setResults(users);
    } catch {
      setError('搜索失败');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const toggleUser = (user: User) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setCreating(true);
    setError('');
    try {
      const chat = await chatService.createGroup(
        groupName.trim(),
        selected.map((u) => u.id),
      );
      addChat(chat);
      onClose();
    } catch {
      setError('创建群聊失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>创建群聊</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <input
        className={styles.input}
        placeholder="群聊名称"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <div className={styles.section}>
        <div className={styles.sectionLabel}>添加成员</div>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            placeholder="搜索用户…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={searching || !query.trim()}
          >
            {searching ? '…' : '搜索'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={styles.userList}>
          {results.map((user) => {
            const checked = selected.some((u) => u.id === user.id);
            return (
              <label key={user.id} className={styles.userItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checked}
                  onChange={() => toggleUser(user)}
                />
                <UserAvatar src={user.avatar_url} name={user.nickname || user.username} size="sm" />
                <span className={styles.userName}>{user.nickname || user.username}</span>
              </label>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className={styles.selectedTags}>
          {selected.map((u) => (
            <span key={u.id} className={styles.tag}>
              {u.nickname || u.username}
              <button className={styles.tagRemove} onClick={() => toggleUser(u)}>×</button>
            </span>
          ))}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.actionBtn}
        disabled={creating || !groupName.trim() || selected.length === 0}
        onClick={handleCreate}
      >
        {creating ? '创建中…' : `创建群聊 (${selected.length}人)`}
      </button>
    </>
  );
}

function ManageMode({ chatId, onClose }: { chatId: number; onClose: () => void }) {
  const [members, setMembers] = useState<Array<{ user: User; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addSelected, setAddSelected] = useState<User[]>([]);
  const [error, setError] = useState('');
  const currentUser = useAuthStore((s) => s.user);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await chatService.getMembers(chatId);
      setMembers(data);
    } catch {
      setError('获取成员失败');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useState(() => {
    fetchMembers();
  });

  const myRole = members.find((m) => m.user.id === currentUser?.id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const users = await chatService.searchUsers(query.trim());
      const memberIds = new Set(members.map((m) => m.user.id));
      setResults(users.filter((u) => !memberIds.has(u.id)));
    } catch {
      setError('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const toggleAddUser = (user: User) => {
    setAddSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleAddMembers = async () => {
    if (addSelected.length === 0) return;
    try {
      await chatService.addMembers(chatId, addSelected.map((u) => u.id));
      setAddSelected([]);
      setResults([]);
      setQuery('');
      await fetchMembers();
    } catch {
      setError('添加成员失败');
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      await chatService.removeMember(chatId, userId);
      await fetchMembers();
    } catch {
      setError('移除成员失败');
    }
  };

  const roleLabel = (role: string) => {
    if (role === 'owner') return '群主';
    if (role === 'admin') return '管理员';
    return '';
  };

  if (loading) {
    return (
      <>
        <div className={styles.header}>
          <span className={styles.title}>群聊管理</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          加载中…
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>群聊管理 ({members.length}人)</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.memberList}>
        {members.map(({ user, role }) => (
          <div key={user.id} className={styles.memberItem}>
            <UserAvatar src={user.avatar_url} name={user.nickname || user.username} size="sm" />
            <div className={styles.memberInfo}>
              <span className={styles.userName}>{user.nickname || user.username}</span>
              {roleLabel(role) && <span className={styles.roleBadge}>{roleLabel(role)}</span>}
            </div>
            {canManage && role === 'member' && user.id !== currentUser?.id && (
              <button className={styles.removeBtn} onClick={() => handleRemove(user.id)}>
                移除
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>添加成员</div>
          <div className={styles.searchRow}>
            <input
              className={styles.input}
              placeholder="搜索用户…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className={styles.searchBtn}
              onClick={handleSearch}
              disabled={searching || !query.trim()}
            >
              {searching ? '…' : '搜索'}
            </button>
          </div>

          {results.length > 0 && (
            <div className={styles.userList}>
              {results.map((user) => {
                const checked = addSelected.some((u) => u.id === user.id);
                return (
                  <label key={user.id} className={styles.userItem}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => toggleAddUser(user)}
                    />
                    <UserAvatar src={user.avatar_url} name={user.nickname || user.username} size="sm" />
                    <span className={styles.userName}>{user.nickname || user.username}</span>
                  </label>
                );
              })}
            </div>
          )}

          {addSelected.length > 0 && (
            <button className={styles.actionBtn} onClick={handleAddMembers}>
              添加 ({addSelected.length}人)
            </button>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </>
  );
}

export default GroupManager;
