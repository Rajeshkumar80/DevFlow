import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { CodeIssue } from '../types';

export class IssueService {
  constructor(private db: any) {}

  async createIssue(reviewId: string, issueType: string, severity: string, description: string, filePath?: string, lineNumber?: number, suggestion?: string, aiGenerated = false): Promise<CodeIssue> {
    const issue = {
      id: uuidv4(), review_id: reviewId, issue_type: issueType, severity,
      file_path: filePath || null, line_number: lineNumber || null,
      description, suggestion: suggestion || null,
      ai_generated: aiGenerated, status: 'open', created_at: new Date()
    } as any;
    if (this.db.issues) this.db.issues.push(issue);
    return issue;
  }

  async getIssuesForReview(reviewId: string): Promise<CodeIssue[]> {
    return (this.db.issues || []).filter((i: any) => i.review_id === reviewId);
  }

  async getIssue(issueId: string): Promise<CodeIssue | null> {
    return (this.db.issues || []).find((i: any) => i.id === issueId) || null;
  }

  async updateIssueStatus(issueId: string, status: string): Promise<CodeIssue | null> {
    const i = (this.db.issues || []).find((x: any) => x.id === issueId);
    if (i) i.status = status;
    return i || null;
  }

  async getIssuesBySeverity(reviewId: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const issue of (this.db.issues || []).filter((i: any) => i.review_id === reviewId)) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    }
    return counts;
  }
}