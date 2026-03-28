import { useState, useEffect } from 'react';

interface TypingEntry {
  userId: number;
  timeout: ReturnType<typeof setTimeout>;
}

interface TypingState {
  [chatId: number]: TypingEntry[];
}

// Global state managed outside React for simplicity
let typingState: TypingState = {};
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function setTyping(chatId: number, userId: number) {
  if (!typingState[chatId]) typingState[chatId] = [];

  // Clear existing timeout for this user
  const existing = typingState[chatId].find((t) => t.userId === userId);
  if (existing) {
    clearTimeout(existing.timeout);
    typingState[chatId] = typingState[chatId].filter((t) => t.userId !== userId);
  }

  // Add with 3s timeout
  const timeout = setTimeout(() => {
    typingState[chatId] = (typingState[chatId] || []).filter((t) => t.userId !== userId);
    notify();
  }, 3000);

  typingState[chatId] = [...(typingState[chatId] || []), { userId, timeout }];
  notify();
}

export function useTypingIndicator(chatId: number | null) {
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  useEffect(() => {
    const update = () => {
      if (chatId && typingState[chatId]) {
        setTypingUsers(typingState[chatId].map((t) => t.userId));
      } else {
        setTypingUsers([]);
      }
    };
    listeners.push(update);
    update();
    return () => {
      listeners = listeners.filter((fn) => fn !== update);
    };
  }, [chatId]);

  return typingUsers;
}
