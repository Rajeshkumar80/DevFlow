import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { FixService } from '../services/FixService';
import { prisma } from '../db/prisma';

const router = Router();

router.post('/:reviewId/issues/:issueId/fix', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const fixService = new FixService();
    const fix = await fixService.generateFix(req.params.reviewId, req.params.issueId, req.userId!);
    res.status(201).json(fix);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post('/:fixId/apply', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const fixService = new FixService();
    const review = await fixService.applyFix(req.params.fixId, req.userId!);
    res.json({ review });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get('/:reviewId/issues/:issueId/fix', async (req: Request, res: Response) => {
  try {
    const fix = await prisma.fixSuggestion.findFirst({ where: { issue_id: req.params.issueId, review_id: req.params.reviewId } });
    res.json(fix || null);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
