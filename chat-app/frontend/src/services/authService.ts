import { api } from './api';
import type { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  register: (username: string, password: string, nickname: string) =>
    api.post<AuthResponse>('/register', { username, password, nickname }),

  login: (username: string, password: string) =>
    api.post<AuthResponse>('/login', { username, password }),

  getMe: () => api.get<User>('/me'),
};
