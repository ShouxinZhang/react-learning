import type { Message } from '../../types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showSender?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function MessageBubble({ message, isMine, showSender }: MessageBubbleProps) {
  return (
    <div className={`${styles.row} ${isMine ? styles.mine : styles.other}`}>
      <div className={styles.bubbleWrap}>
        {showSender && !isMine && message.sender_nickname && (
          <span className={styles.sender}>{message.sender_nickname}</span>
        )}
        <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOther}`}>
          <p className={styles.content}>{message.content}</p>
          <span className={styles.time}>{formatTime(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
