import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.get('/repos/:repoId/ownership', async (req: Request, res: Response) => {
  try {
    const ownerships = await prisma.codeOwnership.findMany({
      where: { repo_id: req.params.repoId },
      orderBy: { expertise_score: 'desc' }
    });
    res.json({ ownerships });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get('/repos/:repoId/assignments/:reviewId', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.reviewId } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const ownerships = await prisma.codeOwnership.findMany({
      where: { repo_id: req.params.repoId },
      orderBy: { expertise_score: 'desc' },
      take: 10,
    });

    const userScores: Record<string, number> = {};
    for (const o of ownerships) {
      userScores[o.user_id] = (userScores[o.user_id] || 0) + o.expertise_score;
    }

    const suggested = Object.entries(userScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([userId, score]) => ({ user_id: userId, score }));

    res.json({ suggested });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post('/reviews/:reviewId/assign', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    // Just track ownership for now
    const review = await prisma.review.findUnique({ where: { id: req.params.reviewId } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await prisma.codeOwnership.upsert({
      where: { user_id_repo_id_file_pattern: { user_id, repo_id: review.repo_id, file_pattern: '*' } },
      create: { user_id, repo_id: review.repo_id, file_pattern: '*', review_count: 1, last_reviewed: new Date(), expertise_score: 1 },
      update: { review_count: { increment: 1 }, last_reviewed: new Date(), expertise_score: { increment: 0.1 } }
    });

    res.json({ assigned: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
