import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  onTyping?: () => void;
}

const MAX_ROWS = 4;
const LINE_HEIGHT = 20;

export function MessageInput({ onSend, disabled, onTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingRef = useRef(0);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS * LINE_HEIGHT)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    // reset height after clearing
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
      }
    });
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const empty = text.trim().length === 0;

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        rows={1}
        placeholder="输入消息…"
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          adjustHeight();
          if (onTyping) {
            const now = Date.now();
            if (now - lastTypingRef.current > 3000) {
              lastTypingRef.current = now;
              onTyping();
            }
          }
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        className={styles.sendBtn}
        disabled={disabled || empty}
        onClick={handleSend}
      >
        发送
      </button>
    </div>
  );
}

export default MessageInput;
