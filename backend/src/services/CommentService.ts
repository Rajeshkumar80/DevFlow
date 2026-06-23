import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

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
    return prisma.comment.create({
      data: {
        id: uuidv4(),
        review_id: reviewId,
        author_id: authorId,
        file_path: filePath || null,
        line_number: lineNumber || null,
        content,
        is_suggestion: isSuggestion,
        suggestion_text: suggestionText || null,
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
