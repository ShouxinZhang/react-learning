import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
}));

import { authService } from '../../services/authService';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const mockUser = { id: 1, username: 'alice', nickname: 'Alice', avatar_url: null, created_at: '2026-01-01' };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.setState(initialState);
});

describe('authStore', () => {
  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('login success sets user, token, isAuthenticated', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: mockUser, token: 'tok123' });

    await useAuthStore.getState().login('alice', 'pass');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('tok123');
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(localStorage.getItem('token')).toBe('tok123');
  });

  it('login failure sets error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    await expect(useAuthStore.getState().login('alice', 'bad')).rejects.toThrow('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.error).toBe('Invalid credentials');
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('register success sets user, token, isAuthenticated', async () => {
    vi.mocked(authService.register).mockResolvedValue({ user: mockUser, token: 'reg-tok' });

    await useAuthStore.getState().register('alice', 'pass', 'Alice');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('reg-tok');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('reg-tok');
  });

  it('logout clears everything and removes from localStorage', () => {
    useAuthStore.setState({ user: mockUser, token: 'tok', isAuthenticated: true });
    localStorage.setItem('token', 'tok');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('checkAuth with no token stays unauthenticated', async () => {
    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(authService.getMe).not.toHaveBeenCalled();
  });

  it('checkAuth with valid token sets user', async () => {
    localStorage.setItem('token', 'valid');
    vi.mocked(authService.getMe).mockResolvedValue(mockUser);

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('checkAuth with invalid token clears state', async () => {
    localStorage.setItem('token', 'expired');
    vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().checkAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
