import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { ChatList } from '../ChatList/ChatList';
import { ContactList } from '../ContactList/ContactList';
import { GroupManager } from '../GroupManager/GroupManager';
import styles from './Sidebar.module.css';

type Tab = 'chats' | 'contacts';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'chats' ? styles.active : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          聊天
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          联系人
        </button>
        <button
          className={styles.groupBtn}
          onClick={() => setShowGroupCreate(true)}
          title="创建群聊"
        >
          +群
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'chats' ? <ChatList /> : <ContactList />}
      </div>

      {user && (
        <div className={styles.userArea}>
          <UserAvatar
            src={user.avatar_url}
            name={user.nickname || user.username}
            size="sm"
          />
          <span className={styles.userInfo}>
            {user.nickname || user.username}
          </span>
          <button className={styles.logoutBtn} onClick={logout}>
            退出
          </button>
        </div>
      )}
      {showGroupCreate && (
        <GroupManager mode="create" onClose={() => setShowGroupCreate(false)} />
      )}
    </aside>
  );
}

export default Sidebar;
