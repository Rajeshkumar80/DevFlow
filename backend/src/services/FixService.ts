import { prisma } from '../db/prisma';
import { OpenRouterService } from './OpenRouterService';

export class FixService {
  async generateFix(reviewId: string, issueId: string, userId: string) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new Error('Issue not found');
    const codeFile = await prisma.codeFile.findFirst({ where: { review_id: reviewId, name: issue.file_path || undefined } });
    if (!codeFile) throw new Error('File not found for this issue');

    const apiKey = await OpenRouterService.getApiKey();
    if (!apiKey) {
      return this.fallbackFix(issue, codeFile);
    }

    const model = await OpenRouterService.getModel();
    const prompt = `You are a code fixer. Given this code and issue, generate a fix.
CODE:
\`\`\`
${codeFile.content}
\`\`\`
ISSUE:
- Type: ${issue.issue_type}
- Severity: ${issue.severity}
- Description: ${issue.description}
- Suggestion: ${issue.suggestion || 'N/A'}

Respond with JSON only: {"fixed_code":"<complete fixed file>","explanation":"<what you changed>"}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'DevFlow Auto-Fix',
        },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 3000 }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI model');

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleaned);

      const fix = await prisma.fixSuggestion.create({
        data: {
          id: `fix-${Date.now()}`,
          issue_id: issueId,
          review_id: reviewId,
          original_code: codeFile.content,
          fixed_code: result.fixed_code || codeFile.content,
          explanation: result.explanation || 'AI-generated fix',
        }
      });
      return fix;
    } catch (err: any) {
      return this.fallbackFix(issue, codeFile);
    }
  }

  private async fallbackFix(issue: any, codeFile: any) {
    let fixedCode = codeFile.content;
    let explanation = 'Manual review recommended';

    if (issue.issue_type === 'style' && issue.description.includes('var ')) {
      fixedCode = codeFile.content.replace(/\bvar\b/g, 'const');
      explanation = 'Replaced var with const for block scoping';
    } else if (issue.issue_type === 'style' && issue.description.includes('console.log')) {
      fixedCode = codeFile.content.replace(/console\.log\([^)]*\);?\n?/g, '');
      explanation = 'Removed console.log statements';
    } else if (issue.suggestion) {
      explanation = `Suggested fix: ${issue.suggestion}`;
    }

    const fix = await prisma.fixSuggestion.create({
      data: {
        id: `fix-${Date.now()}`,
        issue_id: issue.id,
        review_id: codeFile.review_id,
        original_code: codeFile.content,
        fixed_code: fixedCode,
        explanation,
      }
    });
    return fix;
  }

  async applyFix(fixId: string, userId: string) {
    const fix = await prisma.fixSuggestion.findUnique({ where: { id: fixId } });
    if (!fix) throw new Error('Fix not found');
    const newReview = await prisma.review.create({
      data: {
        id: `review-fix-${Date.now()}`,
        repo_id: 'default',
        title: `Fix: ${fix.explanation.slice(0, 80)}`,
        description: `Auto-fix for review ${fix.review_id}`,
        author_id: userId,
        status: 'open',
        branch_name: 'auto-fix',
        base_branch: 'main',
      }
    });
    const originalFile = await prisma.codeFile.findFirst({ where: { review_id: fix.review_id } });
    if (originalFile) {
      await prisma.codeFile.create({
        data: {
          id: `file-fix-${Date.now()}`,
          review_id: newReview.id,
          name: originalFile.name,
          content: fix.fixed_code,
        }
      });
    }
    await prisma.fixSuggestion.update({ where: { id: fixId }, data: { status: 'applied', applied_at: new Date() } });
    return newReview;
  }
}
