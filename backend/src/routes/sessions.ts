import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function createSessionRouter(db: any) {
  const router = Router();

  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, creatorId } = req.body;
      const session = {
        id: uuidv4(),
        name: name || 'Pair Session',
        creator_id: creatorId,
        status: 'active',
        code: '// Welcome to pair programming!\n// Start coding together...\n\nfunction greet(name: string) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));\n',
        participants: [creatorId],
        created_at: new Date(),
        updated_at: new Date()
      };
      db.sessions.push(session);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/', (req: Request, res: Response) => {
    const { status } = req.query;
    let sessions = db.sessions || [];
    if (status) sessions = sessions.filter((s: any) => s.status === status);
    res.json(sessions);
  });

  router.get('/:sessionId', (req: Request, res: Response) => {
    const session = db.sessions?.find((s: any) => s.id === req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  });

  router.post('/:sessionId/join', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const session = db.sessions?.find((s: any) => s.id === req.params.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
      }
      session.updated_at = new Date();
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:sessionId', (req: Request, res: Response) => {
    try {
      const session = db.sessions?.find((s: any) => s.id === req.params.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      Object.assign(session, req.body, { updated_at: new Date() });
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
