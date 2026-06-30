import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.post('/github', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { repo_owner, repo_name, access_token, webhook_secret } = req.body;
    if (!repo_owner || !repo_name || !access_token || !webhook_secret) {
      return res.status(400).json({ error: 'Missing required fields: repo_owner, repo_name, access_token, webhook_secret' });
    }
    if (repo_owner.length > 100 || repo_name.length > 100) {
      return res.status(400).json({ error: 'Repository owner/name too long' });
    }
    if (access_token.length > 500) {
      return res.status(400).json({ error: 'Access token too long' });
    }

    const existing = await prisma.githubConfig.findFirst({
      where: { user_id: req.userId!, repo_full_name: `${repo_owner}/${repo_name}` }
    });
    if (existing) {
      return res.status(409).json({ error: 'Integration already exists for this repository' });
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
    const config = await prisma.githubConfig.findUnique({ where: { id: req.params.id } });
    if (!config) return res.status(404).json({ error: 'Integration not found' });
    if (config.user_id !== req.userId!) return res.status(403).json({ error: 'Not authorized' });
    await prisma.githubConfig.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/github/:id', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const config = await prisma.githubConfig.findUnique({ where: { id: req.params.id } });
    if (!config) return res.status(404).json({ error: 'Integration not found' });
    if (config.user_id !== req.userId!) return res.status(403).json({ error: 'Not authorized' });

    const { is_active, auto_review } = req.body;
    const updateData: any = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (auto_review !== undefined) updateData.auto_review = auto_review;

    const updated = await prisma.githubConfig.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ config: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
