import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';
import { CodeReview } from '../types';

const ALLOWED_UPDATE_FIELDS = ['title', 'description', 'branchName', 'priority', 'status'];

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

function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return stripDangerousHtml(input.trim().substring(0, maxLength));
}

export class ReviewService {
  async createReview(
    repoId: string,
    title: string,
    description: string,
    authorId: string,
    branchName: string,
    baseBranch = 'main',
    codeFiles?: { name: string; content: string }[]
  ): Promise<any> {
    const safeTitle = sanitizeInput(title, 200);
    const safeDescription = sanitizeInput(description || '', 2000);
    const safeBranch = sanitizeInput(branchName, 100);
    const safeBase = sanitizeInput(baseBranch, 100);

    if (!safeTitle) throw new Error('Title is required');

    const filesChanged = codeFiles ? codeFiles.length : 0;
    const additions = codeFiles
      ? codeFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0)
      : 0;

    await prisma.repository.upsert({
      where: { id: repoId },
      create: { id: repoId, name: repoId, owner_id: authorId },
      update: {},
    });

    const review = await prisma.review.create({
      data: {
        id: uuidv4(),
        repo_id: repoId,
        title: safeTitle,
        description: safeDescription,
        author_id: authorId,
        branch_name: safeBranch,
        base_branch: safeBase,
        status: 'open',
        files_changed: filesChanged,
        additions,
        deletions: 0,
        priority: 'medium',
        codeFiles: codeFiles
          ? {
              create: codeFiles.map((f) => ({
                id: uuidv4(),
                name: sanitizeInput(f.name, 200),
                content: f.content.substring(0, 100000),
              })),
            }
          : undefined,
      },
      include: { codeFiles: true },
    });

    return review;
  }

  async getReview(reviewId: string): Promise<any | null> {
    return prisma.review.findUnique({
      where: { id: reviewId },
      include: { codeFiles: true, issues: true, comments: true },
    });
  }

  async listReviews(
    repoId: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<any[]> {
    const where: any = { repo_id: repoId };
    if (status) where.status = status;

    return prisma.review.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: { codeFiles: true },
    });
  }

  async checkOwnership(reviewId: string, userId: string): Promise<boolean> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    return review?.author_id === userId;
  }

  async updateReviewStatus(
    reviewId: string,
    status: string,
    userId: string
  ): Promise<any | null> {
    const owned = await this.checkOwnership(reviewId, userId);
    if (!owned) throw new Error('Not authorized to modify this review');
    try {
      return await prisma.review.update({
        where: { id: reviewId },
        data: {
          status,
          ...(status === 'merged' ? { merged_at: new Date() } : {}),
        },
      });
    } catch {
      return null;
    }
  }

  async updateReview(reviewId: string, data: any, userId: string): Promise<any | null> {
    const owned = await this.checkOwnership(reviewId, userId);
    if (!owned) throw new Error('Not authorized to modify this review');

    const safeData: any = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
    safeData.updated_at = new Date();

    try {
      return await prisma.review.update({
        where: { id: reviewId },
        data: safeData,
      });
    } catch {
      return null;
    }
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const owned = await this.checkOwnership(reviewId, userId);
    if (!owned) throw new Error('Not authorized to delete this review');
    await prisma.review.delete({ where: { id: reviewId } });
  }
}
