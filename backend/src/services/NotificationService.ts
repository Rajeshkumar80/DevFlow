import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  constructor(_db?: any) {}

  async createNotification(
    userId: string,
    type: string,
    title: string,
    content?: string,
    reviewId?: string
  ): Promise<any> {
    return prisma.notification.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        type,
        title,
        content: content || null,
        review_id: reviewId || null,
        is_read: false,
      },
    });
  }

  async getNotifications(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async markAsRead(notificationId: string): Promise<any | null> {
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { is_read: true },
      });
    } catch {
      return null;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return result.count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }
}
