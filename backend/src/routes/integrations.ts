import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.post('/github', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { repo_owner, repo_name, access_token, webhook_secret } = req.body;
    if (!repo_owner || !repo_name || !access_token || !webhook_secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const config = await prisma.githubConfig.create({
      data: {
        user_id: req.userId!,
        repo_owner,
        repo_name,
        repo_full_name: `${repo_owner}/${repo_name}`,
        access_token,
        webhook_secret,
      }
    });
    res.status(201).json({ config, webhook_url: `/api/v1/webhooks/github` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/github', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const configs = await prisma.githubConfig.findMany({
      where: { user_id: req.userId! },
      select: { id: true, repo_owner: true, repo_name: true, repo_full_name: true, is_active: true, auto_review: true, created_at: true }
    });
    res.json({ configs });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/github/:id', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    await prisma.githubConfig.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/github/:id', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { is_active, auto_review } = req.body;
    const config = await prisma.githubConfig.update({
      where: { id: req.params.id },
      data: { ...(is_active !== undefined && { is_active }), ...(auto_review !== undefined && { auto_review }) }
    });
    res.json({ config });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
