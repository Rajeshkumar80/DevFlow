import { prisma } from '../db/prisma';
import { v4 as uuidv4 } from 'uuid';

export class IssueService {
  constructor(_db?: any) {}

  async createIssue(
    reviewId: string,
    issueType: string,
    severity: string,
    description: string,
    filePath?: string,
    lineNumber?: number,
    suggestion?: string,
    aiGenerated = false
  ): Promise<any> {
    return prisma.issue.create({
      data: {
        id: `issue-${uuidv4()}`,
        review_id: reviewId,
        issue_type: issueType,
        severity,
        file_path: filePath || null,
        line_number: lineNumber || null,
        description,
        suggestion: suggestion || null,
        ai_generated: aiGenerated,
        status: 'open',
      },
    });
  }

  async getIssuesForReview(reviewId: string): Promise<any[]> {
    return prisma.issue.findMany({
      where: { review_id: reviewId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getIssue(issueId: string): Promise<any | null> {
    return prisma.issue.findUnique({ where: { id: issueId } });
  }

  async updateIssueStatus(
    issueId: string,
    status: string
  ): Promise<any | null> {
    try {
      return await prisma.issue.update({
        where: { id: issueId },
        data: { status },
      });
    } catch {
      return null;
    }
  }

  async getIssuesBySeverity(
    reviewId: string
  ): Promise<Record<string, number>> {
    const issues = await prisma.issue.findMany({
      where: { review_id: reviewId },
    });
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const issue of issues) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    }
    return counts;
  }
}
