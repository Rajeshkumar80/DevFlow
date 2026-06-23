import { prisma } from '../db/prisma';
import { OpenRouterService } from './OpenRouterService';
import { v4 as uuid } from 'uuid';

export class CodeAnalysisService {
  static async analyzeCode(
    code: string,
    language: string,
    filePath: string | undefined,
    reviewId: string
  ) {
    let result;
    try {
      result = await OpenRouterService.analyzeCode(code, language, filePath);
    } catch (aiError: any) {
      result = this.fallbackAnalysis(code, language, filePath);
      result.summary = `[Fallback Analysis] ${aiError.message}. Using pattern-based analysis.`;
    }

    const issues = [];
    for (const issue of result.issues) {
      const created = await prisma.issue.create({
        data: {
          id: `issue-${uuid()}`,
          review_id: reviewId,
          issue_type: issue.issue_type,
          severity: issue.severity,
          file_path: issue.file_path || filePath || null,
          line_number: issue.line_number || null,
          description: issue.description,
          suggestion: issue.suggestion || null,
          ai_generated: true,
          status: 'open',
        },
      });
      issues.push(created);
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { ai_score: result.overallScore },
    });

    return { issues, overallScore: result.overallScore, summary: result.summary };
  }

  static async batchAnalyze(
    files: { name: string; content: string; language?: string }[],
    reviewId: string
  ) {
    const allIssues = [];
    let totalScore = 0;

    for (const file of files) {
      const result = await this.analyzeCode(
        file.content,
        file.language || 'javascript',
        file.name,
        reviewId
      );
      allIssues.push(...result.issues);
      totalScore += result.overallScore;
    }

    const avgScore = files.length > 0 ? totalScore / files.length : 0;
    await prisma.review.update({
      where: { id: reviewId },
      data: { ai_score: Math.round(avgScore * 10) / 10 },
    });

    return {
      issues: allIssues,
      overallScore: Math.round(avgScore * 10) / 10,
      summary: `Analyzed ${files.length} files, found ${allIssues.length} issues`,
    };
  }

  static async generateSuggestions(code: string, language: string, issueType: string) {
    try {
      const apiKey = await OpenRouterService.getApiKey();
      if (!apiKey) return this.fallbackSuggestions();

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'DevFlow',
        },
        body: JSON.stringify({
          model: await OpenRouterService.getModel(),
          messages: [
            {
              role: 'system',
              content: 'You are a code improvement assistant. Return JSON with: { "refactoringSuggestions": ["..."], "improvedCode": "...", "explanation": "..." }',
            },
            {
              role: 'user',
              content: `Improve this ${language} code addressing ${issueType} issues:\n\n${code}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) return this.fallbackSuggestions();
      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content || '';
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return this.fallbackSuggestions();
    }
  }

  private static fallbackAnalysis(code: string, language: string, filePath?: string) {
    const issues: any[] = [];

    if (code.includes('password') || code.includes('secret') || code.includes('api_key')) {
      issues.push({
        issue_type: 'security',
        severity: 'critical',
        file_path: filePath,
        description: 'Potential hardcoded credential detected',
        suggestion: 'Use environment variables or a secrets manager',
      });
    }
    if (code.includes('var ')) {
      issues.push({
        issue_type: 'style',
        severity: 'medium',
        file_path: filePath,
        description: 'Use let/const instead of var',
        suggestion: 'Replace var with let or const for block scoping',
      });
    }
    if (code.includes('console.log')) {
      issues.push({
        issue_type: 'style',
        severity: 'low',
        file_path: filePath,
        description: 'console.log statements left in code',
        suggestion: 'Remove debug logging before committing',
      });
    }
    if (code.length > 500) {
      issues.push({
        issue_type: 'performance',
        severity: 'medium',
        file_path: filePath,
        description: 'Large code block may benefit from decomposition',
        suggestion: 'Consider breaking into smaller functions',
      });
    }

    const score = Math.max(1, 5 - issues.length * 0.5);
    return {
      issues,
      overallScore: Math.round(score * 10) / 10,
      summary: `Pattern-based analysis found ${issues.length} issues (AI unavailable)`,
    };
  }

  private static fallbackSuggestions() {
    return {
      refactoringSuggestions: [
        'Extract repeated logic into functions',
        'Add proper error handling',
        'Use more descriptive variable names',
      ],
      improvedCode: '// Improved code would appear here',
      explanation: 'General improvements suggested',
    };
  }
}
