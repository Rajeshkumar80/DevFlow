import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.get('/', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { months = '6' } = req.query;
    const numMonths = parseInt(months as string);
    const snapshots = [];

    for (let i = 0; i < numMonths; i++) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const reviews = await prisma.review.findMany({
        where: { created_at: { gte: start, lt: end } },
        include: { issues: true }
      });

      const totalIssues = reviews.reduce((sum: number, r: any) => sum + r.issues.length, 0);
      const resolvedIssues = reviews.reduce((sum: number, r: any) => sum + r.issues.filter((i: any) => i.status === 'resolved').length, 0);
      const criticalIssues = reviews.reduce((sum: number, r: any) => sum + r.issues.filter((i: any) => i.severity === 'critical').length, 0);

      snapshots.push({
        period: start.toISOString().slice(0, 7),
        avg_score: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.ai_score || 0), 0) / reviews.length : null,
        issues_per_review: reviews.length > 0 ? totalIssues / reviews.length : null,
        resolution_rate: totalIssues > 0 ? resolvedIssues / totalIssues : null,
        critical_rate: totalIssues > 0 ? criticalIssues / totalIssues : null,
        review_count: reviews.length,
        issue_count: totalIssues,
      });
    }

    res.json({ snapshots: snapshots.reverse() });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
