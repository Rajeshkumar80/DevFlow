import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';

export function createNotificationRouter(db: Pool) {
  const router = Router();
  const notificationService = new NotificationService(db);

  router.get('/', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0' } = req.query;
      const notifications = await notificationService.getNotifications(
        req.userId!,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      const unreadCount = await notificationService.getUnreadCount(req.userId!);
      res.json({ notifications, unreadCount });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:id/read', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/read-all', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const count = await notificationService.markAllAsRead(req.userId!);
      res.json({ markedAsRead: count });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}