import { create } from 'zustand';

interface PresenceState {
  onlineUsers: Set<number>;
  setOnline: (userId: number) => void;
  setOffline: (userId: number) => void;
  setOnlineUsers: (userIds: number[]) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set(),
  setOnline: (userId) => {
    const next = new Set(get().onlineUsers);
    next.add(userId);
    set({ onlineUsers: next });
  },
  setOffline: (userId) => {
    const next = new Set(get().onlineUsers);
    next.delete(userId);
    set({ onlineUsers: next });
  },
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
}));
