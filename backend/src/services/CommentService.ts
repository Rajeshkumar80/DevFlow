import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

function stripDangerousHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '')
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim();
}

export class CommentService {
  constructor(_db?: any) {}

  async addComment(
    reviewId: string,
    authorId: string,
    filePath: string | null,
    lineNumber: number | null,
    content: string,
    isSuggestion = false,
    suggestionText?: string,
    threadId?: string
  ): Promise<any> {
    if (!content || typeof content !== 'string' || content.length > 5000) {
      throw new Error('Comment content is required and must be under 5000 characters');
    }
    const safeContent = stripDangerousHtml(content.trim());
    const safeSuggestion = suggestionText ? stripDangerousHtml(suggestionText.trim().substring(0, 2000)) : null;
    const safeFilePath = filePath ? stripDangerousHtml(filePath.substring(0, 500)) : null;

    return prisma.comment.create({
      data: {
        id: uuidv4(),
        review_id: reviewId,
        author_id: authorId,
        file_path: safeFilePath,
        line_number: lineNumber || null,
        content: safeContent,
        is_suggestion: isSuggestion,
        suggestion_text: safeSuggestion,
        thread_id: threadId || null,
        resolved: false,
      },
      include: { author: { select: { username: true, avatar_url: true } } },
    });
  }

  async getComments(reviewId: string): Promise<any[]> {
    return prisma.comment.findMany({
      where: { review_id: reviewId },
      orderBy: { created_at: 'asc' },
      include: { author: { select: { username: true, avatar_url: true } } },
    });
  }

  async getComment(commentId: string): Promise<any | null> {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: { select: { username: true, avatar_url: true } } },
    });
  }

  async resolveComment(commentId: string): Promise<any | null> {
    try {
      return await prisma.comment.update({
        where: { id: commentId },
        data: { resolved: true, updated_at: new Date() },
      });
    } catch {
      return null;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    await prisma.comment.delete({ where: { id: commentId } });
  }
}
