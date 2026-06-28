import { Router, Request, Response } from 'express';
import { CommentService } from '../services/CommentService';
import { authMiddleware } from '../middleware/auth';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function createCommentRouter(db?: any) {
  const router = Router();
  const commentService = new CommentService(db);

  router.post('/:reviewId/comments', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { filePath, lineNumber, content, isSuggestion, suggestionText, threadId } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const sanitizedContent = escapeHtml(content);

      const comment = await commentService.addComment(
        req.params.reviewId,
        req.userId!,
        filePath || '',
        lineNumber || 0,
        sanitizedContent,
        isSuggestion || false,
        suggestionText ? escapeHtml(suggestionText) : undefined,
        threadId
      );
      res.status(201).json(comment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:reviewId/comments', async (req: Request, res: Response) => {
    try {
      const comments = await commentService.getComments(req.params.reviewId);
      res.json(comments);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:reviewId/comments/:commentId/resolve', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const comment = await commentService.resolveComment(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json(comment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:reviewId/comments/:commentId', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      await commentService.deleteComment(req.params.commentId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
