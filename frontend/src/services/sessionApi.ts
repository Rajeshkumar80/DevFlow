import api from './api';
import { PairSession } from '../types';

export const sessionApi = {
  createSession: async (data: { name?: string; creatorId: string }): Promise<PairSession> => {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  listSessions: async (status?: string): Promise<PairSession[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<PairSession> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  joinSession: async (sessionId: string, userId: string): Promise<PairSession> => {
    const response = await api.post(`/sessions/${sessionId}/join`, { userId });
    return response.data;
  },

  updateSession: async (sessionId: string, data: Partial<PairSession>): Promise<PairSession> => {
    const response = await api.patch(`/sessions/${sessionId}`, data);
    return response.data;
  }
};
