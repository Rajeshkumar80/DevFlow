import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { authMiddleware } from '../middleware/auth';

export function createReviewRouter(db: any) {
  const router = Router();
  const reviewService = new ReviewService();

  router.post('/:repoId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { title, description, branchName, baseBranch, codeFiles } = req.body;
      const review = await reviewService.createReview(
        req.params.repoId,
        title,
        description,
        req.userId!,
        branchName,
        baseBranch || 'main',
        codeFiles
      );
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:repoId', async (req: Request, res: Response) => {
    try {
      const { status, limit = '20', offset = '0' } = req.query;
      const reviews = await reviewService.listReviews(
        req.params.repoId,
        status as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(reviews);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:repoId/:reviewId', async (req: Request, res: Response) => {
    try {
      const review = await reviewService.getReview(req.params.reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:repoId/:reviewId/status', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const validStatuses = ['draft', 'open', 'approved', 'changes_requested', 'merged'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const review = await reviewService.updateReviewStatus(req.params.reviewId, status, req.userId!);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      res.json(review);
    } catch (err: any) {
      const status = err.message.includes('Not authorized') ? 403 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  router.patch('/:repoId/:reviewId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const review = await reviewService.updateReview(req.params.reviewId, req.body, req.userId!);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      res.json(review);
    } catch (err: any) {
      const status = err.message.includes('Not authorized') ? 403 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  router.delete('/:repoId/:reviewId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      await reviewService.deleteReview(req.params.reviewId, req.userId!);
      res.status(204).send();
    } catch (err: any) {
      const status = err.message.includes('Not authorized') ? 403 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  return router;
}
