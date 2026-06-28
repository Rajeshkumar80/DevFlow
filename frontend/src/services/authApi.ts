import api from './api';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, username: string, password: string, fullName?: string): Promise<{ user: User }> => {
    const response = await api.post('/auth/register', { email, username, password, full_name: fullName });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  }
};
