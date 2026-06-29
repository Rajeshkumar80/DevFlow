import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../db/prisma';

export class GitHubService {
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature) return false;
    const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  static async postPRComment(owner: string, repo: string, prNumber: number, body: string, token: string) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) throw new Error(`Failed to post comment: ${response.statusText}`);
    return response.json();
  }

  static formatReviewComment(review: any, issues: any[], score: number): string {
    const severityEmoji: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: '⚪' };
    let comment = `## 🤖 DevFlow AI Review\n\n**Score:** ${score}/100\n\n`;
    if (issues.length === 0) {
      comment += `✅ No issues found. Code looks good!\n`;
      return comment;
    }
    comment += `**Found ${issues.length} issue(s):**\n\n`;
    for (const issue of issues) {
      const emoji = severityEmoji[issue.severity] || '⚪';
      comment += `${emoji} **${issue.severity.toUpperCase()}** — \`${issue.file_path || 'general'}\`\n`;
      comment += `> ${issue.description}\n`;
      if (issue.suggestion) comment += `> 💡 ${issue.suggestion}\n`;
      comment += `\n`;
    }
    comment += `---\n*Powered by DevFlow AI*`;
    return comment;
  }
}
