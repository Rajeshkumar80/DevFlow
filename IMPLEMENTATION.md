# DevFlow — Future Implementation Plan

> **Status:** Planning
> **Last Updated:** 2026-06-28
> **Target:** Implement all 9 features across 4 weeks

---

## Table of Contents

1. [GitHub Webhook Auto-Reviews](#1-github-webhook-auto-reviews)
2. [Auto-Fix Suggestions](#2-auto-fix-suggestions)
3. [Review Rules Config](#3-review-rules-config)
4. [Cost Tracking Dashboard](#4-cost-tracking-dashboard)
5. [Review Quality Over Time](#5-review-quality-over-time)
6. [Dependency-Aware Analysis](#6-dependency-aware-analysis)
7. [AI Review Persona](#7-ai-review-persona)
8. [Smart Review Assignment](#8-smart-review-assignment)
9. [MCP Server for IDE](#9-mcp-server-for-ide)

---

## 1. GitHub Webhook Auto-Reviews

### Overview
When a PR is opened or updated on GitHub, DevFlow automatically creates a review, runs AI analysis, and posts findings as a PR comment.

### Architecture

```
GitHub PR Event
    ↓
POST /api/v1/webhooks/github
    ↓
Verify HMAC-SHA256 signature
    ↓
Parse PR: title, description, files changed, diff
    ↓
Create Review record in DB (status: analyzing)
    ↓
Fetch full diff via GitHub API (Octokit)
    ↓
Run AI analysis (OpenRouter)
    ↓
Save issues to DB
    ↓
Post findings as GitHub PR comment
    ↓
Update Review status to completed
    ↓
Log cost to CostEvent table
```

### Database Changes

**New Prisma Model: `GithubConfig`**
```prisma
model GithubConfig {
  id                String   @id @default(cuid())
  user_id           String
  repo_owner        String   // e.g. "Rajeshkumar80"
  repo_name         String   // e.g. "DevFlow"
  repo_full_name    String   // e.g. "Rajeshkumar80/DevFlow"
  github_repo_id    Int      // GitHub's numeric repo ID
  webhook_secret    String   // HMAC secret for signature verification
  access_token      String   // GitHub personal access token (encrypted)
  is_active         Boolean  @default(true)
  auto_review       Boolean  @default(true)  // auto-review on PR open
  default_persona   String?  // default AI persona for this repo
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  user User @relation(fields: [user_id], references: [id])
}
```

**New Prisma Model: `WebhookLog`**
```prisma
model WebhookLog {
  id              String   @id @default(cuid())
  github_config_id String
  event_type      String   // "pull_request", "push", etc.
  action          String   // "opened", "synchronize", "closed"
  pr_number       Int
  pr_title        String?
  status          String   // "received", "processed", "failed"
  error_message   String?
  payload         String   // raw JSON (for debugging)
  created_at      DateTime @default(now())

  githubConfig GithubConfig @relation(fields: [github_config_id], references: [id])
}
```

### New Files

```
backend/src/
├── routes/
│   └── webhooks.ts              # Webhook receiver
├── services/
│   └── GitHubService.ts         # GitHub API integration
├── types/
│   └── github.ts                # GitHub webhook event types
```

### Backend Implementation

**`backend/src/services/GitHubService.ts`**
```ts
import { Octokit } from 'octokit';
import { createHmac, timingSafeEqual } from 'crypto';

export class GitHubService {
  // Verify webhook signature
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  // Fetch PR details
  static async getPR(owner: string, repo: string, prNumber: number, token: string) {
    const octokit = new Octokit({ auth: token });
    const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
    return pr;
  }

  // Fetch PR diff
  static async getPRDiff(owner: string, repo: string, prNumber: number, token: string): Promise<string> {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber,
      mediaType: { format: 'diff' }
    });
    return data as unknown as string;
  }

  // Fetch changed files
  static async getPRFiles(owner: string, repo: string, prNumber: number, token: string) {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.listFiles({
      owner, repo, pull_number: prNumber,
      per_page: 100
    });
    return data;
  }

  // Post PR comment
  static async postPRComment(owner: string, repo: string, prNumber: number, body: string, token: string) {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.issues.createComment({
      owner, repo, issue_number: prNumber, body
    });
  }

  // Format review findings as PR comment
  static formatReviewComment(review: any, issues: any[], score: number): string {
    const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: '⚪' };

    let comment = `## 🤖 DevFlow AI Review\n\n`;
    comment += `**Score:** ${score}/100\n\n`;

    if (issues.length === 0) {
      comment += `✅ No issues found. Code looks good!\n`;
      return comment;
    }

    comment += `**Found ${issues.length} issue(s):**\n\n`;
    for (const issue of issues) {
      const emoji = severityEmoji[issue.severity] || '⚪';
      comment += `${emoji} **${issue.severity.toUpperCase()}** — ${issue.file_path}:${issue.line_number}\n`;
      comment += `> ${issue.description}\n`;
      if (issue.suggestion) {
        comment += `> 💡 **Suggestion:** ${issue.suggestion}\n`;
      }
      comment += `\n`;
    }

    comment += `---\n*Powered by DevFlow AI — [View in DevFlow](http://localhost:3000/reviews/${review.id})*`;
    return comment;
  }
}
```

**`backend/src/routes/webhooks.ts`**
```ts
import { Router, Request, Response } from 'express';
import { GitHubService } from '../services/GitHubService';
import { CodeAnalysisService } from '../services/CodeAnalysisService';
import { prisma } from '../db/prisma';

const router = Router();

router.post('/github', async (req: Request, res: Response) => {
  try {
    // 1. Verify signature
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = JSON.stringify(req.body);

    // Find config by repo
    const payload = req.body;
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) return res.status(400).json({ error: 'Missing repository' });

    const config = await prisma.githubConfig.findFirst({
      where: { repo_full_name: repoFullName, is_active: true }
    });
    if (!config) return res.status(404).json({ error: 'Repo not configured' });

    if (!GitHubService.verifySignature(body, signature, config.webhook_secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Handle PR events
    const eventType = req.headers['x-github-event'];
    if (eventType === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
      const pr = payload.pull_request;

      // Log webhook
      await prisma.webhookLog.create({
        data: {
          github_config_id: config.id,
          event_type: eventType,
          action: payload.action,
          pr_number: pr.number,
          pr_title: pr.title,
          status: 'received',
          payload: body.slice(0, 10000),
        }
      });

      // 3. Create review record
      const review = await prisma.review.create({
        data: {
          id: `review-gh-${Date.now()}`,
          repo_id: 'default',
          title: `PR #${pr.number}: ${pr.title}`,
          description: pr.body || '',
          author_id: config.user_id,
          status: 'analyzing',
          branch_name: pr.head.ref,
          base_branch: pr.base.ref,
        }
      });

      // 4. Fetch diff and analyze
      try {
        const diff = await GitHubService.getPRDiff(
          config.repo_owner, config.repo_name, pr.number, config.access_token
        );

        const analysisService = new CodeAnalysisService();
        const result = await analysisService.analyzeCode(review.id, diff, config.default_persona || undefined);

        // 5. Post comment on GitHub
        const comment = GitHubService.formatReviewComment(review, result.issues, result.ai_score);
        await GitHubService.postPRComment(
          config.repo_owner, config.repo_name, pr.number, comment, config.access_token
        );

        // Update review
        await prisma.review.update({
          where: { id: review.id },
          data: { status: 'completed', ai_score: result.ai_score }
        });
      } catch (err: any) {
        await prisma.review.update({
          where: { id: review.id },
          data: { status: 'failed' }
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

### Frontend Implementation

**New Page: `IntegrationsPage.tsx`**
- List connected GitHub repos
- "Connect Repository" button → opens GitHub OAuth or PAT input
- Toggle auto-review on/off per repo
- Show webhook status (active/failed)
- Recent auto-reviews list

**Settings > Integrations Tab:**
- GitHub connection status
- Add/remove repos
- Webhook URL to configure in GitHub

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/webhooks/github` | Receive GitHub webhook |
| `POST` | `/api/v1/integrations/github` | Connect a repo |
| `GET` | `/api/v1/integrations/github` | List connected repos |
| `DELETE` | `/api/v1/integrations/github/:id` | Disconnect repo |
| `GET` | `/api/v1/integrations/github/:id/status` | Webhook health |

### Dependencies to Install

```bash
npm install octokit
npm install -D @types/octokit
```

---

## 2. Auto-Fix Suggestions

### Overview
AI generates exact code fixes for each issue. User can preview the diff and apply the fix with one click.

### Architecture

```
User clicks "Fix" on issue
    ↓
POST /api/v1/:reviewId/issues/:issueId/fix
    ↓
Fetch original file content from CodeFile
    ↓
Send to AI: "Fix this issue in this code"
    ↓
AI returns: { fixed_code, explanation }
    ↓
Show side-by-side diff preview
    ↓
User clicks "Apply Fix"
    ↓
Create new Review with fixed CodeFile content
    ↓
Optionally create PR via GitHub API
```

### Database Changes

**New Prisma Model: `FixSuggestion`**
```prisma
model FixSuggestion {
  id              String   @id @default(cuid())
  issue_id        String
  review_id       String
  original_code   String
  fixed_code      String
  explanation     String
  status          String   @default("pending") // pending, applied, rejected
  applied_at      DateTime?
  created_at      DateTime @default(now())

  issue  Issue  @relation(fields: [issue_id], references: [id])
  review Review @relation(fields: [review_id], references: [id])
}
```

### New Files

```
backend/src/
├── routes/
│   └── fixes.ts                 # Fix suggestion endpoints
├── services/
│   └── FixService.ts            # Fix generation logic
```

### Backend Implementation

**`backend/src/services/FixService.ts`**
```ts
import { OpenRouterService } from './OpenRouterService';
import { prisma } from '../db/prisma';

export class FixService {
  private openRouter: OpenRouterService;

  constructor() {
    this.openRouter = new OpenRouterService();
  }

  async generateFix(reviewId: string, issueId: string, userId: string) {
    // 1. Get issue and review
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new Error('Issue not found');

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');

    // 2. Get original file content
    const codeFile = await prisma.codeFile.findFirst({
      where: { review_id: reviewId, name: issue.file_path }
    });
    if (!codeFile) throw new Error('File not found');

    // 3. Generate fix with AI
    const prompt = `You are a code fixer. Given the following code and issue, generate a fix.

CODE:
\`\`\`
${codeFile.content}
\`\`\`

ISSUE:
- Type: ${issue.issue_type}
- Severity: ${issue.severity}
- Line: ${issue.line_number}
- Description: ${issue.description}
- Suggestion: ${issue.suggestion || 'N/A'}

Respond with JSON:
{
  "fixed_code": "<the complete fixed file content>",
  "explanation": "<brief explanation of what you changed>"
}`;

    const model = await this.openRouter.getSelectedModel();
    const response = await this.openRouter.chat([
      { role: 'user', content: prompt }
    ], model, true); // strict mode for JSON

    const result = JSON.parse(response.content);

    // 4. Save fix suggestion
    const fix = await prisma.fixSuggestion.create({
      data: {
        issue_id: issueId,
        review_id: reviewId,
        original_code: codeFile.content,
        fixed_code: result.fixed_code,
        explanation: result.explanation,
      }
    });

    return fix;
  }

  async applyFix(fixId: string, userId: string) {
    const fix = await prisma.fixSuggestion.findUnique({ where: { id: fixId } });
    if (!fix) throw new Error('Fix not found');

    // Create new review with fixed code
    const newReview = await prisma.review.create({
      data: {
        id: `review-fix-${Date.now()}`,
        repo_id: 'default',
        title: `Fix applied: ${fix.explanation.slice(0, 100)}`,
        description: `Auto-fix applied for issue in review ${fix.review_id}`,
        author_id: userId,
        status: 'open',
        branch_name: 'auto-fix',
      }
    });

    // Create code file with fixed content
    const originalFile = await prisma.codeFile.findFirst({
      where: { review_id: fix.review_id }
    });
    if (originalFile) {
      await prisma.codeFile.create({
        data: {
          review_id: newReview.id,
          name: originalFile.name,
          content: fix.fixed_code,
        }
      });
    }

    // Update fix status
    await prisma.fixSuggestion.update({
      where: { id: fixId },
      data: { status: 'applied', applied_at: new Date() }
    });

    return newReview;
  }
}
```

**`backend/src/routes/fixes.ts`**
```ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { FixService } from '../services/FixService';

const router = Router();

// Generate fix suggestion
router.post('/:reviewId/issues/:issueId/fix', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const fixService = new FixService();
    const fix = await fixService.generateFix(
      req.params.reviewId,
      req.params.issueId,
      req.userId!
    );
    res.status(201).json(fix);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Apply fix
router.post('/:fixId/apply', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const fixService = new FixService();
    const review = await fixService.applyFix(req.params.fixId, req.userId!);
    res.json({ review });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get fix suggestion
router.get('/:reviewId/issues/:issueId/fix', async (req: Request, res: Response) => {
  try {
    const fix = await prisma.fixSuggestion.findFirst({
      where: { issue_id: req.params.issueId, review_id: req.params.reviewId }
    });
    res.json(fix || null);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
```

### Frontend Implementation

**New Component: `FixPreviewModal.tsx`**
```
┌─────────────────────────────────────────┐
│  🔧 Auto-Fix Suggestion                 │
├─────────────────────────────────────────┤
│                                         │
│  Original Code          Fixed Code      │
│  ┌─────────────┐      ┌─────────────┐  │
│  │ - old code  │  →   │ + new code  │  │
│  │   unchanged │      │   unchanged │  │
│  └─────────────┘      └─────────────┘  │
│                                         │
│  📝 Explanation: Changed X to Y because │
│                                         │
│  [Apply Fix]  [Copy]  [Cancel]          │
└─────────────────────────────────────────┘
```

**ReviewDetailPage changes:**
- Each issue card gets a "Fix" button
- Clicking opens FixPreviewModal
- "Apply Fix" creates new review with fixed code

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/:reviewId/issues/:issueId/fix` | Generate fix |
| `GET` | `/api/v1/:reviewId/issues/:issueId/fix` | Get existing fix |
| `POST` | `/api/v1/fixes/:fixId/apply` | Apply fix |

---

## 3. Review Rules Config

### Overview
Teams define custom rules in `.devflow.yml` per repo. Rules are enforced during AI analysis and can block reviews.

### Rule Types

```yaml
rules:
  # Regex pattern match
  - name: "No console.log"
    type: pattern
    pattern: "console\\.log\\("
    severity: warning
    message: "Use logger instead of console.log"

  # Max line count
  - name: "Max function length"
    type: max_lines
    max: 50
    severity: error
    message: "Function exceeds 50 lines"

  # Require documentation
  - name: "Require JSDoc on exports"
    type: require
    require: jsdoc
    severity: info
    message: "Exported functions need JSDoc"

  # Forbidden imports
  - name: "No eval()"
    type: forbidden
    forbidden: ["eval", "Function("]
    severity: critical
    message: "eval() is a security risk"

  # File pattern exclusion
  - name: "Skip test files"
    type: skip
    pattern: "*.test.ts"
    skip: true

  # Complexity check
  - name: "Max cyclomatic complexity"
    type: complexity
    max: 10
    severity: warning
```

### Database Changes

**New Prisma Model: `ReviewRule`**
```prisma
model ReviewRule {
  id          String   @id @default(cuid())
  repo_id     String
  name        String
  type        String   // pattern, max_lines, require, forbidden, skip, complexity
  pattern     String?  // regex pattern
  max         Int?     // max value for max_lines, complexity
  forbidden   String?  // JSON array of forbidden terms
  require     String?  // what to require (jsdoc, types, tests)
  severity    String   @default("warning") // info, warning, error, critical
  message     String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())

  repository Repository @relation(fields: [repo_id], references: [id])
}
```

### Backend Implementation

**Rule engine in `CodeAnalysisService.ts`:**
```ts
async applyRules(reviewId: string, files: CodeFile[], rules: ReviewRule[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  for (const file of files) {
    for (const rule of rules) {
      if (!rule.is_active) continue;

      switch (rule.type) {
        case 'pattern':
          const regex = new RegExp(rule.pattern!, 'g');
          const lines = file.content.split('\n');
          lines.forEach((line, idx) => {
            if (regex.test(line)) {
              issues.push({
                file_path: file.name,
                line_number: idx + 1,
                description: rule.message || `Pattern matched: ${rule.pattern}`,
                severity: rule.severity,
                issue_type: 'rule_violation',
              });
            }
          });
          break;

        case 'max_lines':
          const lineCount = file.content.split('\n').length;
          if (lineCount > rule.max!) {
            issues.push({
              file_path: file.name,
              line_number: 1,
              description: rule.message || `File exceeds ${rule.max} lines`,
              severity: rule.severity,
              issue_type: 'rule_violation',
            });
          }
          break;

        case 'forbidden':
          const forbidden = JSON.parse(rule.forbidden!);
          for (const term of forbidden) {
            if (file.content.includes(term)) {
              issues.push({
                file_path: file.name,
                line_number: 1,
                description: rule.message || `Forbidden term: ${term}`,
                severity: rule.severity,
                issue_type: 'security',
              });
            }
          }
          break;
      }
    }
  }

  return issues;
}
```

### Frontend Implementation

**Settings > Rules Tab:**
```
┌─────────────────────────────────────────────────┐
│  Review Rules                                    │
├─────────────────────────────────────────────────┤
│  Repository: Rajeshkumar80/DevFlow              │
│                                                  │
│  [+ Add Rule]                                    │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🔴 No console.log          [pattern] [ON]  │ │
│  │ 🟡 Max function 50 lines   [max]    [ON]  │ │
│  │ 🔵 Require JSDoc           [require] [ON] │ │
│  │ ⚪ Skip test files         [skip]   [ON]  │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Rule Builder:                                   │
│  Name: [____________]                            │
│  Type: [pattern ▼]                               │
│  Pattern: [____________]                         │
│  Severity: [warning ▼]                           │
│  Message: [____________]                         │
│  [Save]  [Test Rule]                             │
└─────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/repos/:repoId/rules` | List rules |
| `POST` | `/api/v1/repos/:repoId/rules` | Create rule |
| `PATCH` | `/api/v1/rules/:ruleId` | Update rule |
| `DELETE` | `/api/v1/rules/:ruleId` | Delete rule |
| `POST` | `/api/v1/rules/:ruleId/test` | Test rule against sample code |

### Config File Support

Also support `.devflow.yml` in repo root:
```ts
// In GitHubService, when fetching PR diff:
const configContent = await this.getFileContent(owner, repo, '.devflow.yml', token);
if (configContent) {
  const config = yaml.parse(configContent);
  // Merge with DB rules
}
```

---

## 4. Cost Tracking Dashboard

### Overview
Track every AI API call — tokens used, cost, model, user, review. Display in analytics dashboard.

### Database Changes

**New Prisma Model: `CostEvent`**
```prisma
model CostEvent {
  id              String   @id @default(cuid())
  user_id         String
  review_id       String?
  model           String   // "openai/gpt-4o-mini"
  input_tokens    Int
  output_tokens   Int
  cost_cents      Int      // cost in cents (e.g. 3 = $0.03)
  duration_ms     Int?     // API response time
  status          String   // "success", "error", "fallback"
  created_at      DateTime @default(now())

  user   User    @relation(fields: [user_id], references: [id])
  review Review? @relation(fields: [review_id], references: [id])
}
```

### Model Pricing (Hardcoded or Configurable)

```ts
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini':        { input: 0.15, output: 0.60 },   // per 1M tokens
  'openai/gpt-4o':             { input: 2.50, output: 10.00 },
  'anthropic/claude-3-haiku':  { input: 0.25, output: 1.25 },
  'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
  'google/gemini-2.0-flash':   { input: 0.10, output: 0.40 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return Math.round(
    (inputTokens / 1_000_000) * pricing.input * 100 +
    (outputTokens / 1_000_000) * pricing.output * 100
  );
}
```

### Backend Changes

**Update `OpenRouterService.ts`:**
```ts
async chat(messages: any[], model: string): Promise<{ content: string; tokens: number; cost: number }> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({ model, messages }),
  });

  const data = await response.json();
  const duration = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateCost(model, inputTokens, outputTokens);

  // Log to CostEvent
  await prisma.costEvent.create({
    data: {
      user_id: userId,
      review_id: reviewId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: cost,
      duration_ms: duration,
      status: 'success',
    }
  });

  return {
    content: data.choices[0].message.content,
    tokens: inputTokens + outputTokens,
    cost,
  };
}
```

**New endpoint: `GET /api/v1/analytics/costs`**
```ts
router.get('/costs', authMiddleware(null), async (req, res) => {
  const { period = '30d', user_id } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string));

  const costs = await prisma.costEvent.groupBy({
    by: ['model', 'created_at'],
    where: {
      created_at: { gte: startDate },
      ...(user_id ? { user_id: user_id as string } : {}),
    },
    _sum: { cost_cents: true, input_tokens: true, output_tokens: true },
    _count: true,
  });

  const totalCost = costs.reduce((sum, c) => sum + (c._sum.cost_cents || 0), 0);
  const totalTokens = costs.reduce((sum, c) => sum + (c._sum.input_tokens || 0) + (c._sum.output_tokens || 0), 0);

  res.json({ totalCost, totalTokens, breakdown: costs });
});
```

### Frontend Implementation

**New Component: `CostsPage.tsx`**
```
┌─────────────────────────────────────────────────┐
│  💰 Cost Tracking                    Period: [30d ▼]│
├─────────────────────────────────────────────────┤
│                                                  │
│  This Month          Daily Spend                 │
│  ┌──────────┐       ┌─────────────────────┐     │
│  │ $12.45   │       │  $█                 │     │
│  │ 423K tok │       │  ████               │     │
│  │ 156 reviews│     │  ██████  █          │     │
│  └──────────┘       └─────────────────────┘     │
│                                                  │
│  Cost by Model                                   │
│  ┌─────────────────────────────────────────┐    │
│  │ gpt-4o-mini  ████████████  $8.20 (66%) │    │
│  │ claude-3     █████         $3.10 (25%) │    │
│  │ gemini-flash ██            $1.15 (9%)  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Recent Analyses                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Review #123  gpt-4o-mini  1.2K tok $0.01│    │
│  │ Review #122  claude-3     2.1K tok $0.05│    │
│  │ Review #121  gemini       0.8K tok $0.00│    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/costs?period=30d` | Cost summary |
| `GET` | `/api/v1/analytics/costs/daily?period=30d` | Daily breakdown |
| `GET` | `/api/v1/analytics/costs/by-model` | Cost by model |
| `GET` | `/api/v1/analytics/costs/by-user` | Cost by user |

---

## 5. Review Quality Over Time

### Overview
Track code quality metrics month-over-month to show improvement or regression.

### Metrics Tracked

| Metric | Description | How to Calculate |
|---|---|---|
| **Avg AI Score** | Average score across all reviews | `AVG(ai_score)` per period |
| **Issues per Review** | Average issues found per review | `COUNT(issues) / COUNT(reviews)` |
| **Resolution Rate** | % of issues that get resolved | `resolved_issues / total_issues` |
| **Critical Issue Rate** | % of issues that are critical | `critical_issues / total_issues` |
| **Review Coverage** | % of PRs that get reviewed | `reviews / total_prs` |
| **Time to Review** | Avg time from PR open to review complete | `AVG(completed_at - created_at)` |

### Database Changes

**New Prisma Model: `QualitySnapshot`**
```prisma
model QualitySnapshot {
  id                String   @id @default(cuid())
  team_id           String
  period_start      DateTime // week or month start
  period_end        DateTime
  avg_score         Float?
  issues_per_review Float?
  resolution_rate   Float?
  critical_rate     Float?
  review_count      Int
  issue_count       Int
  resolved_count    Int
  created_at        DateTime @default(now())
}
```

### Backend Implementation

**New endpoint: `GET /api/v1/analytics/quality`**
```ts
router.get('/quality', authMiddleware(null), async (req, res) => {
  const { period = '6months' } = req.query;

  // Calculate monthly snapshots
  const months = parseInt(period as string);
  const snapshots = [];

  for (let i = 0; i < months; i++) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const reviews = await prisma.review.findMany({
      where: { created_at: { gte: start, lt: end } },
      include: { issues: true }
    });

    const totalIssues = reviews.reduce((sum, r) => sum + r.issues.length, 0);
    const resolvedIssues = reviews.reduce((sum, r) =>
      sum + r.issues.filter(i => i.status === 'resolved').length, 0
    );
    const criticalIssues = reviews.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'critical').length, 0
    );

    snapshots.push({
      period: start.toISOString().slice(0, 7), // "2026-06"
      avg_score: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.ai_score || 0), 0) / reviews.length
        : null,
      issues_per_review: reviews.length > 0 ? totalIssues / reviews.length : null,
      resolution_rate: totalIssues > 0 ? resolvedIssues / totalIssues : null,
      critical_rate: totalIssues > 0 ? criticalIssues / totalIssues : null,
      review_count: reviews.length,
      issue_count: totalIssues,
    });
  }

  res.json({ snapshots: snapshots.reverse() });
});
```

### Frontend Implementation

**Analytics page: Quality Trends section**
- Line chart: avg score over 6 months
- Bar chart: issues per review trend
- Comparison: this month vs last month
- Highlight: "Quality improved 12% this month"

---

## 6. Dependency-Aware Analysis

### Overview
When reviewing a file, AI checks what other files depend on it to assess ripple effects.

### Architecture

```
File changed in review
    ↓
Parse imports (regex)
    ↓
Query FileDependency table
    ↓
Find files that import from changed file
    ↓
Fetch those files' content
    ↓
Include in AI prompt as context
    ↓
AI analyzes ripple effects
```

### Database Changes

**New Prisma Model: `FileDependency`**
```prisma
model FileDependency {
  id           String   @id @default(cuid())
  repo_id      String
  file_path    String
  imports      String   // JSON: ["./utils", "react", "./types"]
  imported_by  String   // JSON: ["./app.tsx", "./main.tsx"]
  language     String?  // "typescript", "python", etc.
  updated_at   DateTime @updatedAt

  @@unique([repo_id, file_path])
}
```

### Backend Implementation

**New Service: `DependencyService.ts`**
```ts
export class DependencyService {
  // Parse imports from code
  parseImports(content: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Match: import { x } from './path'
      // Match: import x from 'path'
      // Match: const x = require('path')
      const regex = /(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const path = match[1] || match[2];
        if (path && !path.startsWith('@') && !path.includes('node_modules')) {
          imports.push(path);
        }
      }
    }

    return imports;
  }

  // Build dependency graph for a repo
  async buildGraph(repoId: string, files: { path: string; content: string }[]) {
    for (const file of files) {
      const ext = file.path.split('.').pop();
      const language = ext === 'ts' || ext === 'tsx' ? 'typescript'
                     : ext === 'py' ? 'python'
                     : 'unknown';

      const imports = this.parseImports(file.content, language);

      // Find who imports this file
      const importedBy = files
        .filter(f => f.path !== file.path)
        .filter(f => imports.some(imp => f.content.includes(imp)))
        .map(f => f.path);

      await prisma.fileDependency.upsert({
        where: { repo_id_file_path: { repo_id: repoId, file_path: file.path } },
        create: {
          repo_id: repoId,
          file_path: file.path,
          imports: JSON.stringify(imports),
          imported_by: JSON.stringify(importedBy),
          language,
        },
        update: {
          imports: JSON.stringify(imports),
          imported_by: JSON.stringify(importedBy),
          language,
        }
      });
    }
  }

  // Get impact analysis for a file
  async getImpact(file_path: string, repoId: string) {
    const deps = await prisma.fileDependency.findFirst({
      where: { repo_id: repoId, file_path }
    });
    if (!deps) return { imports: [], importedBy: [], riskLevel: 'low' };

    const imports = JSON.parse(deps.imports);
    const importedBy = JSON.parse(deps.imported_by);

    // Risk level based on how many files depend on this one
    const riskLevel = importedBy.length > 5 ? 'high'
                    : importedBy.length > 2 ? 'medium'
                    : 'low';

    return { imports, importedBy, riskLevel };
  }
}
```

### Frontend Implementation

**ReviewDetailPage: Impact Analysis panel**
```
┌─────────────────────────────────────────┐
│  📊 Impact Analysis                      │
├─────────────────────────────────────────┤
│  Risk Level: 🟡 MEDIUM                   │
│                                          │
│  This file imports:                      │
│  ├── ./utils/helpers                     │
│  ├── ./types/index                       │
│  └── react                               │
│                                          │
│  Files affected by changes to this file: │
│  ├── src/app.tsx (imports this)          │
│  ├── src/components/Header.tsx           │
│  └── src/pages/Dashboard.tsx             │
│                                          │
│  ⚠️ Changes may affect 3 other files     │
└─────────────────────────────────────────┘
```

---

## 7. AI Review Persona

### Overview
Choose a reviewer personality that changes how the AI analyzes code.

### Default Personas

```ts
const DEFAULT_PERSONAS = [
  {
    name: 'strict',
    display_name: 'Strict Reviewer',
    description: 'Extremely critical. Finds every possible issue.',
    system_prompt: 'You are an extremely strict code reviewer. Be critical of every decision. Do not approve code that has any issues, no matter how minor. Find edge cases, potential bugs, and style issues.',
    tone: 'demanding',
    icon: '🔍',
  },
  {
    name: 'security',
    display_name: 'Security Auditor',
    description: 'Focuses exclusively on security vulnerabilities.',
    system_prompt: 'You are a security-focused code reviewer. Your ONLY concern is security: injection attacks, auth bypass, data exposure, XSS, CSRF, insecure dependencies, hardcoded secrets, and cryptographic weaknesses. Ignore style and performance.',
    tone: 'cautious',
    icon: '🛡️',
  },
  {
    name: 'performance',
    display_name: 'Performance Expert',
    description: 'Optimizes for speed and efficiency.',
    system_prompt: 'You are a performance-focused reviewer. Focus on: N+1 queries, unnecessary re-renders, memory leaks, bundle size, algorithmic complexity, caching opportunities, and efficient data structures.',
    tone: 'optimizing',
    icon: '⚡',
  },
  {
    name: 'friendly',
    display_name: 'Friendly Mentor',
    description: 'Encouraging. Points out issues gently.',
    system_prompt: 'You are a friendly, encouraging code reviewer. Praise good patterns first. Point out issues gently with "consider..." or "you might want to...". Be supportive and constructive.',
    tone: 'supportive',
    icon: '😊',
  },
  {
    name: 'junior',
    display_name: 'Teaching Reviewer',
    description: 'Explains everything for learning.',
    system_prompt: 'You are a teaching-focused code reviewer. Explain every issue in detail. Include learning resources and links. Help the developer understand WHY something is an issue, not just WHAT to fix.',
    tone: 'educational',
    icon: '📚',
  },
];
```

### Database Changes

**New Prisma Model: `ReviewPersona`**
```prisma
model ReviewPersona {
  id              String   @id @default(cuid())
  name            String   @unique
  display_name    String
  description     String?
  system_prompt   String
  tone            String
  icon            String?
  is_custom       Boolean  @default(false)
  user_id         String?
  created_at      DateTime @default(now())

  user User? @relation(fields: [user_id], references: [id])
}
```

### Backend Implementation

**Update `CodeAnalysisService.ts`:**
```ts
async analyzeCode(reviewId: string, code: string, personaName?: string) {
  // Get persona
  const persona = personaName
    ? await prisma.reviewPersona.findFirst({ where: { name: personaName } })
    : await prisma.reviewPersona.findFirst({ where: { name: 'strict' } }); // default

  const systemPrompt = persona?.system_prompt || 'You are a code reviewer.';

  // Inject persona into analysis
  const prompt = `${systemPrompt}

Analyze the following code and provide:
1. Overall score (0-100)
2. Issues found with severity, file path, line number, description, and suggestion

Code:
${code}`;

  // ... rest of analysis
}
```

### Frontend Implementation

**Settings > Persona Tab:**
```
┌─────────────────────────────────────────────────┐
│  🎭 AI Review Persona                           │
├─────────────────────────────────────────────────┤
│                                                  │
│  Default Persona: [Strict Reviewer ▼]            │
│                                                  │
│  Available Personas:                             │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🔍 Strict Reviewer        [SELECTED]        │ │
│  │ 🛡️  Security Auditor       [Select]          │ │
│  │ ⚡ Performance Expert      [Select]          │ │
│  │ 😊 Friendly Mentor         [Select]          │ │
│  │ 📚 Teaching Reviewer       [Select]          │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  [+ Create Custom Persona]                       │
│                                                  │
│  Custom Persona Builder:                         │
│  Name: [____________]                            │
│  System Prompt: [____________]                   │
│  Tone: [____________]                            │
│  [Save]                                          │
└─────────────────────────────────────────────────┘
```

**Review Create: persona override**
```
┌─────────────────────────────────────────┐
│  Create Review                           │
│                                          │
│  Title: [____________]                   │
│  Code: [____________]                    │
│  Persona: [Default ▼]  ← override       │
│  [Submit]                                │
└─────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/personas` | List all personas |
| `POST` | `/api/v1/personas` | Create custom persona |
| `DELETE` | `/api/v1/personas/:id` | Delete custom persona |
| `GET` | `/api/v1/settings/persona` | Get default persona |
| `POST` | `/api/v1/settings/persona` | Set default persona |

---

## 8. Smart Review Assignment

### Overview
Auto-assign reviewers based on who owns the changed files (most reviews on those files = best reviewer).

### Database Changes

**New Prisma Model: `CodeOwnership`**
```prisma
model CodeOwnership {
  id              String   @id @default(cuid())
  user_id         String
  repo_id         String
  file_pattern    String   // "src/services/*.ts" or exact path
  review_count    Int      @default(0)
  last_reviewed   DateTime?
  expertise_score Float  @default(0)  // calculated score

  user User @relation(fields: [user_id], references: [id])

  @@unique([user_id, repo_id, file_pattern])
}
```

### Backend Implementation

**Track ownership on every review:**
```ts
// When a user completes a review:
async trackOwnership(userId: string, repoId: string, filePaths: string[]) {
  for (const filePath of filePaths) {
    // Find or create ownership record
    const existing = await prisma.codeOwnership.findFirst({
      where: { user_id: userId, repo_id: repoId, file_pattern: filePath }
    });

    if (existing) {
      await prisma.codeOwnership.update({
        where: { id: existing.id },
        data: {
          review_count: existing.review_count + 1,
          last_reviewed: new Date(),
          expertise_score: this.calculateExpertise(existing.review_count + 1, existing.last_reviewed),
        }
      });
    } else {
      await prisma.codeOwnership.create({
        data: {
          user_id: userId,
          repo_id: repoId,
          file_pattern: filePath,
          review_count: 1,
          last_reviewed: new Date(),
          expertise_score: 1,
        }
      });
    }
  }
}

calculateExpertise(reviewCount: number, lastReviewed: Date | null): number {
  // More reviews = higher score
  const countScore = Math.min(reviewCount / 10, 1); // max 1.0 at 10 reviews

  // Recent reviews = higher score
  const daysSinceLastReview = lastReviewed
    ? (Date.now() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const recencyScore = Math.max(0, 1 - daysSinceLastReview / 30); // decays over 30 days

  return countScore * 0.7 + recencyScore * 0.3;
}
```

**Auto-assign on review creation:**
```ts
async suggestReviewers(repoId: string, filePaths: string[]): Promise<string[]> {
  const ownerships = await prisma.codeOwnership.findMany({
    where: { repo_id: repoId, file_pattern: { in: filePaths } },
    orderBy: { expertise_score: 'desc' },
    take: 5,
  });

  // Deduplicate users and sort by total expertise
  const userScores: Record<string, number> = {};
  for (const o of ownerships) {
    userScores[o.user_id] = (userScores[o.user_id] || 0) + o.expertise_score;
  }

  return Object.entries(userScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([userId]) => userId);
}
```

### Frontend Implementation

**ReviewDetailPage: Reviewer assignment**
```
┌─────────────────────────────────────────┐
│  👥 Reviewers                             │
│                                          │
│  Assigned:                               │
│  ┌─────────┐  ┌─────────┐              │
│  │ 👤 Alice │  │ 👤 Bob  │  [Reassign]  │
│  │ Owner:  │  │ Owner:  │              │
│  │ 85%     │  │ 72%     │              │
│  └─────────┘  └─────────┘              │
│                                          │
│  Suggested (by expertise):               │
│  • Alice (src/services/* — 12 reviews)  │
│  • Bob (src/routes/* — 8 reviews)       │
│  • Charlie (src/utils/* — 5 reviews)    │
└─────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/repos/:repoId/ownership` | List ownership records |
| `GET` | `/api/v1/repos/:repoId/assignments/:reviewId` | Suggest reviewers |
| `POST` | `/api/v1/reviews/:reviewId/assign` | Assign reviewer |

---

## 9. MCP Server for IDE

### Overview
A separate MCP (Model Context Protocol) server that lets users trigger DevFlow reviews from VS Code, Cursor, or Copilot.

### Architecture

```
VS Code / Cursor
    ↓ (MCP protocol - JSON-RPC over stdio)
devflow-mcp/server.ts
    ↓ (HTTP to DevFlow backend)
POST /api/v1/mcp/review
    ↓
DevFlow AI analysis
    ↓
Results back to IDE
```

### MCP Tools Exposed

```json
{
  "tools": [
    {
      "name": "devflow_review",
      "description": "Review selected code for issues",
      "inputSchema": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "description": "Code to review" },
          "language": { "type": "string", "description": "Programming language" },
          "persona": { "type": "string", "description": "Review persona" }
        },
        "required": ["code"]
      }
    },
    {
      "name": "devflow_fix",
      "description": "Generate a fix for a specific issue",
      "inputSchema": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "description": "Original code" },
          "issue": { "type": "string", "description": "Description of the issue" }
        },
        "required": ["code", "issue"]
      }
    },
    {
      "name": "devflow_explain",
      "description": "Explain code and suggest improvements",
      "inputSchema": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "description": "Code to explain" }
        },
        "required": ["code"]
      }
    }
  ]
}
```

### New Directory Structure

```
devflow-mcp/
├── src/
│   ├── server.ts          # MCP server entry point
│   ├── tools/
│   │   ├── review.ts      # devflow_review tool
│   │   ├── fix.ts         # devflow_fix tool
│   │   └── explain.ts     # devflow_explain tool
│   ├── client.ts          # HTTP client to DevFlow backend
│   └── config.ts          # Configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Implementation

**`devflow-mcp/src/server.ts`**
```ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { reviewTool } from './tools/review';
import { fixTool } from './tools/fix';
import { explainTool } from './tools/explain';

const server = new Server(
  { name: 'devflow-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler('tools/list', async () => ({
  tools: [reviewTool, fixTool, explainTool]
}));

// Call tool
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'devflow_review':
      return await reviewTool.handler(args);
    case 'devflow_fix':
      return await fixTool.handler(args);
    case 'devflow_explain':
      return await explainTool.handler(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DevFlow MCP server running');
}

main();
```

**`devflow-mcp/src/tools/review.ts`**
```ts
import { DevFlowClient } from '../client';

export const reviewTool = {
  name: 'devflow_review',
  description: 'Review selected code for issues',
  inputSchema: {
    type: 'object' as const,
    properties: {
      code: { type: 'string', description: 'Code to review' },
      language: { type: 'string', description: 'Programming language' },
      persona: { type: 'string', description: 'Review persona' },
    },
    required: ['code'],
  },
  handler: async (args: { code: string; language?: string; persona?: string }) => {
    const client = new DevFlowClient();
    const result = await client.reviewCode(args.code, args.language, args.persona);

    return {
      content: [{
        type: 'text',
        text: formatReviewResult(result),
      }]
    };
  }
};

function formatReviewResult(result: any): string {
  let text = `## DevFlow Review\n\nScore: ${result.score}/100\n\n`;

  if (result.issues.length === 0) {
    text += '✅ No issues found!\n';
    return text;
  }

  text += `Found ${result.issues.length} issue(s):\n\n`;
  for (const issue of result.issues) {
    text += `### ${issue.severity.toUpperCase()}: ${issue.description}\n`;
    text += `Line ${issue.line_number} in ${issue.file_path}\n`;
    if (issue.suggestion) text += `> ${issue.suggestion}\n`;
    text += '\n';
  }

  return text;
}
```

### VS Code Configuration

User adds to `.vscode/settings.json`:
```json
{
  "mcpServers": {
    "devflow": {
      "command": "node",
      "args": ["C:/Users/Rajesh/Desktop/DevFlow/devflow-mcp/dist/server.js"],
      "env": {
        "DEVFLOW_API_URL": "http://localhost:5000",
        "DEVFLOW_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  }
}
```

---

## Implementation Timeline

| Week | Features | Effort |
|---|---|---|
| **Week 1** | GitHub Webhook + Auto-Fix + Review Rules | High |
| **Week 2** | Cost Tracking + Quality Over Time | Medium |
| **Week 3** | Dependency-Aware + AI Persona + Smart Assignment | Medium |
| **Week 4** | MCP Server + Integration Testing | Medium |

---

## New Prisma Models Summary

| Model | Purpose |
|---|---|
| `GithubConfig` | GitHub repo connection settings |
| `WebhookLog` | Webhook event logs |
| `FixSuggestion` | AI-generated code fixes |
| `ReviewRule` | Custom review rules per repo |
| `CostEvent` | AI API cost tracking |
| `QualitySnapshot` | Quality metrics over time |
| `FileDependency` | Code dependency graph |
| `ReviewPersona` | AI reviewer personalities |
| `CodeOwnership` | File ownership by developer |

---

## Dependencies to Install

```bash
# Backend
npm install octokit yaml @modelcontextprotocol/sdk

# DevFlow MCP (separate package)
cd devflow-mcp && npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node
```

---

## Final Checklist

- [ ] Phase 1: GitHub Webhook Auto-Reviews
- [ ] Phase 1: Auto-Fix Suggestions
- [ ] Phase 1: Review Rules Config
- [ ] Phase 2: Cost Tracking Dashboard
- [ ] Phase 2: Review Quality Over Time
- [ ] Phase 3: Dependency-Aware Analysis
- [ ] Phase 3: AI Review Persona
- [ ] Phase 3: Smart Review Assignment
- [ ] Phase 4: MCP Server for IDE
- [ ] Update README with new features
- [ ] Update Prisma schema and run migration
- [ ] Integration testing all features
- [ ] Push to GitHub
