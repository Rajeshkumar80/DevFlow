import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';
import { CodeReview } from '../types';

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
    const filesChanged = codeFiles ? codeFiles.length : 0;
    const additions = codeFiles
      ? codeFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0)
      : 0;

    // Ensure repo exists (create a stub if needed)
    await prisma.repository.upsert({
      where: { id: repoId },
      create: { id: repoId, name: repoId, owner_id: authorId },
      update: {},
    });

    const review = await prisma.review.create({
      data: {
        id: uuidv4(),
        repo_id: repoId,
        title,
        description: description || '',
        author_id: authorId,
        branch_name: branchName,
        base_branch: baseBranch,
        status: 'open',
        files_changed: filesChanged,
        additions,
        deletions: 0,
        priority: 'medium',
        codeFiles: codeFiles
          ? {
              create: codeFiles.map((f) => ({
                id: uuidv4(),
                name: f.name,
                content: f.content,
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

  async updateReviewStatus(
    reviewId: string,
    status: string
  ): Promise<any | null> {
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

  async updateReview(reviewId: string, data: any): Promise<any | null> {
    try {
      return await prisma.review.update({
        where: { id: reviewId },
        data: { ...data, updated_at: new Date() },
      });
    } catch {
      return null;
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    await prisma.review.delete({ where: { id: reviewId } });
  }
}
