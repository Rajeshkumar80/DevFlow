import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

export function createAnalyticsRouter(db: any) {
  const router = Router();

  router.get('/team/:teamId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const analytics = db.team_analytics || [];
      const summary = {
        total_reviews: analytics.reduce((a: number, r: any) => a + (r.total_reviews || 0), 0),
        avg_review_time: analytics.length ? analytics.reduce((a: number, r: any) => a + (r.avg_review_time_hours || 0), 0) / analytics.length : 0,
        avg_ai_score: analytics.length ? analytics.reduce((a: number, r: any) => a + (r.avg_ai_score || 0), 0) / analytics.length : 0,
        total_comments: analytics.reduce((a: number, r: any) => a + (r.total_comments || 0), 0)
      };
      res.json({ timeSeries: analytics, summary });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/developer/:userId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const userReviews = (db.reviews || []).filter((r: any) => r.author_id === req.params.userId);
      const userComments = (db.comments || []).filter((c: any) => c.author_id === req.params.userId);
      res.json({
        reviews: { review_count: userReviews.length, avg_review_hours: 0 },
        comments: { comment_count: userComments.length },
        skills: []
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/repository/:repoId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const repoReviews = (db.reviews || []).filter((r: any) => r.repo_id === req.params.repoId);
      const statusCounts: Record<string, number> = {};
      repoReviews.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

      const avgScores = repoReviews.length ? {
        avg_score: repoReviews.reduce((a: number, r: any) => a + (r.ai_score || 0), 0) / repoReviews.length,
        avg_complexity: repoReviews.reduce((a: number, r: any) => a + (r.complexity_score || 0), 0) / repoReviews.length
      } : { avg_score: 0, avg_complexity: 0 };

      res.json({
        reviewsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        issuesBySeverity: [],
        averageScores: avgScores
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}