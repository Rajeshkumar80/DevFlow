import { Router, Request, Response } from 'express';
import { IssueService } from '../services/IssueService';
import { CodeAnalysisService } from '../services/CodeAnalysisService';
import { AnalysisQueue } from '../services/AnalysisQueue';
import { authMiddleware } from '../middleware/auth';

export function createAnalysisRouter(db: any) {
  const router = Router();
  const issueService = new IssueService(db);
  const analysisQueue = new AnalysisQueue();

  router.post('/:reviewId/analyze', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { code, language, filePath } = req.body;
      if (!code || !language) {
        return res.status(400).json({ error: 'Missing code or language' });
      }
      const analysis = await CodeAnalysisService.analyzeCode(code, language, filePath, req.params.reviewId);
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:reviewId/batch-analyze', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Files array is required' });
      }
      const jobId = await analysisQueue.addAnalysisJob(req.params.reviewId, files);
      res.json({ jobId, message: 'Analysis job queued' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:reviewId/batch-analyze/:jobId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const progress = analysisQueue.getJobProgress(req.params.jobId);
      if (!progress) return res.status(404).json({ error: 'Job not found' });
      res.json(progress);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:reviewId/suggestions', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { code, language, issueType } = req.body;
      if (!code || !language || !issueType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const suggestions = await CodeAnalysisService.generateSuggestions(code, language, issueType);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:reviewId/issues', async (req: Request, res: Response) => {
    try {
      const issues = await issueService.getIssuesForReview(req.params.reviewId);
      const bySeverity = await issueService.getIssuesBySeverity(req.params.reviewId);
      res.json({ issues, bySeverity });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:reviewId/issues/:issueId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const issue = await issueService.updateIssueStatus(req.params.issueId, status);
      if (!issue) return res.status(404).json({ error: 'Issue not found' });
      res.json(issue);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
