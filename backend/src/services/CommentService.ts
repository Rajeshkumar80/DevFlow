import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ReviewComment } from '../types';

export class CommentService {
  constructor(private db: any) {}

  async addComment(reviewId: string, authorId: string, filePath: string, lineNumber: number, content: string, isSuggestion = false, suggestionText?: string, threadId?: string): Promise<ReviewComment> {
    const comment = {
      id: uuidv4(), review_id: reviewId, author_id: authorId,
      file_path: filePath, line_number: lineNumber, content,
      is_suggestion: isSuggestion, suggestion_text: suggestionText || null,
      thread_id: threadId || null, resolved: false,
      created_at: new Date(), updated_at: new Date(),
      author_username: 'demo', author_avatar: null
    } as any;
    if (this.db.comments) this.db.comments.push(comment);
    return comment;
  }

  async getComments(reviewId: string): Promise<ReviewComment[]> {
    return (this.db.comments || []).filter((c: any) => c.review_id === reviewId);
  }

  async getComment(commentId: string): Promise<ReviewComment | null> {
    return (this.db.comments || []).find((c: any) => c.id === commentId) || null;
  }

  async resolveComment(commentId: string): Promise<ReviewComment | null> {
    const c = (this.db.comments || []).find((x: any) => x.id === commentId);
    if (c) { c.resolved = true; c.updated_at = new Date(); }
    return c || null;
  }

  async deleteComment(commentId: string): Promise<void> {
    if (this.db.comments) {
      const idx = this.db.comments.findIndex((x: any) => x.id === commentId);
      if (idx >= 0) this.db.comments.splice(idx, 1);
    }
  }
}