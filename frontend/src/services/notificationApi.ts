import api from './api';
import { Notification } from '../types';

export const notificationApi = {
  getNotifications: async (limit = 50, offset = 0): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> => {
    const response = await api.get('/notifications', {
      params: { limit, offset }
    });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ markedAsRead: number }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};