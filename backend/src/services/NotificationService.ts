import { Pool } from 'pg';
import { Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  constructor(private db: any) {}

  async createNotification(userId: string, type: string, title: string, content?: string, reviewId?: string): Promise<Notification> {
    const n: any = { id: uuidv4(), user_id: userId, type, title, content: content || null, review_id: reviewId || null, is_read: false, created_at: new Date() };
    if (this.db.notifications) this.db.notifications.push(n);
    return n;
  }

  async getNotifications(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    return (this.db.notifications || []).filter((n: any) => n.user_id === userId).slice(offset, offset + limit);
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    const n = (this.db.notifications || []).find((x: any) => x.id === notificationId);
    if (n) n.is_read = true;
    return n || null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    for (const n of (this.db.notifications || [])) {
      if (n.user_id === userId && !n.is_read) { n.is_read = true; count++; }
    }
    return count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return (this.db.notifications || []).filter((n: any) => n.user_id === userId && !n.is_read).length;
  }
}