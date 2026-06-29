import { Router, Request, Response } from 'express';
import { GitHubService } from '../services/GitHubService';
import { prisma } from '../db/prisma';

const router = Router();

router.post('/github', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = JSON.stringify(req.body);
    const payload = req.body;
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) return res.status(400).json({ error: 'Missing repository' });

    const config = await prisma.githubConfig.findFirst({
      where: { repo_full_name: repoFullName, is_active: true }
    });
    if (!config) return res.status(200).json({ received: true });

    if (!GitHubService.verifySignature(body, signature, config.webhook_secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const eventType = req.headers['x-github-event'];
    if (eventType === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
      const pr = payload.pull_request;
      await prisma.webhookLog.create({
        data: {
          github_config_id: config.id,
          event_type: eventType,
          action: payload.action,
          pr_number: pr.number,
          pr_title: pr.title,
          status: 'received',
          payload: body.slice(0, 5000),
        }
      });

      const review = await prisma.review.create({
        data: {
          id: `review-gh-${Date.now()}`,
          repo_id: 'default',
          title: `PR #${pr.number}: ${pr.title}`,
          description: pr.body || '',
          author_id: config.user_id,
          status: 'analyzing',
          branch_name: pr.head?.ref || 'unknown',
          base_branch: pr.base?.ref || 'main',
        }
      });

      try {
        const diff = `PR #${pr.number} diff from ${pr.head?.ref || 'unknown'} to ${pr.base?.ref || 'main'}`;
        const { CodeAnalysisService } = await import('../services/CodeAnalysisService');
        const result = await CodeAnalysisService.analyzeCode(diff, 'diff', undefined, review.id);
        const comment = GitHubService.formatReviewComment(review, result.issues, result.overallScore);
        await GitHubService.postPRComment(config.repo_owner, config.repo_name, pr.number, comment, config.access_token);
        await prisma.review.update({ where: { id: review.id }, data: { status: 'completed', ai_score: result.overallScore } });
      } catch (err: any) {
        await prisma.review.update({ where: { id: review.id }, data: { status: 'failed' } });
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
