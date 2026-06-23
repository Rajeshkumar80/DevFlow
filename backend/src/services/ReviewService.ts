import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { CodeReview } from '../types';

export class ReviewService {
  constructor(private db: any) {}

  async createReview(repoId: string, title: string, description: string, authorId: string, branchName: string, baseBranch = 'main', codeFiles?: { name: string; content: string }[]): Promise<CodeReview> {
    const filesChanged = codeFiles ? codeFiles.length : 0;
    const additions = codeFiles ? codeFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0) : 0;
    const review = {
      id: uuidv4(), repo_id: repoId, title, description, author_id: authorId,
      branch_name: branchName, base_branch: baseBranch, status: 'open',
      files_changed: filesChanged, additions, deletions: 0, ai_score: null,
      complexity_score: null, priority: 'medium', created_at: new Date(),
      updated_at: new Date(), metadata: {}, code_files: codeFiles || []
    } as any;
    if (this.db.reviews) this.db.reviews.push(review);
    return review;
  }

  async getReview(reviewId: string): Promise<CodeReview | null> {
    if (this.db.reviews) {
      const r = this.db.reviews.find((x: any) => x.id === reviewId);
      if (r) return { ...r, author_username: 'demo', author_avatar: null };
    }
    return null;
  }

  async listReviews(repoId: string, status?: string, limit = 20, offset = 0): Promise<CodeReview[]> {
    let reviews = this.db.reviews || [];
    if (status) reviews = reviews.filter((r: any) => r.status === status);
    return reviews.slice(offset, offset + limit).map((r: any) => ({ ...r, author_username: 'demo', author_avatar: null }));
  }

  async updateReviewStatus(reviewId: string, status: string): Promise<CodeReview | null> {
    if (this.db.reviews) {
      const r = this.db.reviews.find((x: any) => x.id === reviewId);
      if (r) { r.status = status; r.updated_at = new Date(); if (status === 'merged') r.merged_at = new Date(); return r; }
    }
    return null;
  }

  async updateReview(reviewId: string, data: Partial<CodeReview>): Promise<CodeReview | null> {
    if (this.db.reviews) {
      const r = this.db.reviews.find((x: any) => x.id === reviewId);
      if (r) { Object.assign(r, data); r.updated_at = new Date(); return r; }
    }
    return null;
  }

  async deleteReview(reviewId: string): Promise<void> {
    if (this.db.reviews) {
      const idx = this.db.reviews.findIndex((x: any) => x.id === reviewId);
      if (idx >= 0) this.db.reviews.splice(idx, 1);
    }
  }
}