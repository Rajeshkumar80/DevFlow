import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

export function createSessionRouter(db: any) {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, creatorId } = req.body;
      const session = await prisma.session.create({
        data: {
          id: uuidv4(),
          name: name || 'Pair Session',
          creator_id: creatorId,
          status: 'active',
          code: '// Welcome to pair programming!\n// Start coding together...\n\nfunction greet(name: string) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));\n',
        },
        include: { creator: { select: { username: true } } },
      });
      res.status(201).json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;
    const sessions = await prisma.session.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { username: true, full_name: true, avatar_url: true } },
        participants: true,
      },
    });
    res.json(sessions);
  });

  router.get('/:sessionId', async (req: Request, res: Response) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: {
        creator: { select: { username: true, full_name: true, avatar_url: true } },
        participants: true,
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  });

  router.post('/:sessionId/join', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const session = await prisma.session.findUnique({
        where: { id: req.params.sessionId },
      });
      if (!session) return res.status(404).json({ error: 'Session not found' });

      await prisma.sessionParticipant.upsert({
        where: {
          id: `${req.params.sessionId}-${userId}`,
        },
        create: {
          id: `${req.params.sessionId}-${userId}`,
          session_id: req.params.sessionId,
          user_id: userId,
        },
        update: {},
      });

      const updated = await prisma.session.update({
        where: { id: req.params.sessionId },
        data: { updated_at: new Date() },
        include: { participants: true },
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = await prisma.session.update({
        where: { id: req.params.sessionId },
        data: { ...req.body, updated_at: new Date() },
      });
      res.json(session);
    } catch (err: any) {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  return router;
}
