import { Pool } from 'pg';
import { IssueService } from './IssueService';

export class CodeAnalysisService {
  private issueService: IssueService;

  constructor(private db: any) {
    this.issueService = new IssueService(db);
  }

  async analyzeCode(code: string, language: string, filePath: string, reviewId: string): Promise<any> {
    const issues = [];
    if (code.includes('password') || code.includes('secret')) {
      issues.push({ type: 'security', severity: 'critical', line: this.findLine(code, 'password'), description: 'Potential secret exposed in code', suggestion: 'Use environment variables instead' });
    }
    if (code.includes('var ')) {
      issues.push({ type: 'style', severity: 'medium', line: this.findLine(code, 'var '), description: 'Use const/let instead of var', suggestion: 'Replace var with const or let' });
    }
    if (code.includes('console.log')) {
      issues.push({ type: 'style', severity: 'low', line: this.findLine(code, 'console.log'), description: 'Remove debug console.log statements', suggestion: 'Use proper logging' });
    }
    if (code.length > 500) {
      issues.push({ type: 'performance', severity: 'medium', line: null, description: 'Large code block may need refactoring', suggestion: 'Break into smaller functions' });
    }

    for (const issue of issues) {
      await this.issueService.createIssue(reviewId, issue.type, issue.severity, issue.description, filePath, issue.line || undefined, issue.suggestion || undefined, true);
    }

    return { issues, overallScore: Math.max(1, 5 - issues.length * 0.5), summary: `Found ${issues.length} potential issues in ${language} code` };
  }

  async generateSuggestions(code: string, language: string, issueType: string): Promise<any> {
    return {
      refactoringSuggestions: ['Extract repeated logic into functions', 'Add proper error handling', 'Use more descriptive variable names'],
      improvedCode: '// Refactored code would appear here',
      explanation: `Improvements suggested for ${language} based on ${issueType} analysis`
    };
  }

  private findLine(code: string, pattern: string): number {
    const lines = code.split('\n');
    return lines.findIndex(l => l.includes(pattern)) + 1;
  }
}