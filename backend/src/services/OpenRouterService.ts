import { prisma } from '../db/prisma';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: { message: { content: string } }[];
  model: string;
}

interface AnalysisResult {
  issues: {
    issue_type: string;
    severity: string;
    file_path?: string;
    line_number?: number;
    description: string;
    suggestion?: string;
  }[];
  overallScore: number;
  summary: string;
}

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the given code and return a JSON response with this exact structure:
{
  "issues": [
    {
      "issue_type": "bug" | "security" | "performance" | "style" | "documentation",
      "severity": "low" | "medium" | "high" | "critical",
      "file_path": "string or null",
      "line_number": number or null,
      "description": "clear description of the issue",
      "suggestion": "how to fix it"
    }
  ],
  "overallScore": number between 1 and 5,
  "summary": "brief overall assessment"
}

Rules:
- overallScore: 5 = excellent, 4 = good, 3 = fair, 2 = poor, 1 = critical issues
- Be thorough but avoid false positives
- Check for bugs, security vulnerabilities, performance issues, code style, and documentation
- Return ONLY valid JSON, no markdown or extra text`;

export class OpenRouterService {
  static async getApiKey(): Promise<string | null> {
    const setting = await prisma.setting.findUnique({ where: { key: 'openrouter_api_key' } });
    return setting?.value || null;
  }

  static async setApiKey(key: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key: 'openrouter_api_key' },
      update: { value: key },
      create: { key: 'openrouter_api_key', value: key },
    });
  }

  static async getModel(): Promise<string> {
    const setting = await prisma.setting.findUnique({ where: { key: 'openrouter_model' } });
    return setting?.value || 'google/gemini-2.0-flash-001';
  }

  static async setModel(model: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key: 'openrouter_model' },
      update: { value: model },
      create: { key: 'openrouter_model', value: model },
    });
  }

  static async analyzeCode(
    code: string,
    language: string,
    filePath?: string
  ): Promise<AnalysisResult> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Go to Settings > API Keys to add your key.');
    }

    const model = await this.getModel();

    const userPrompt = `Review this ${language} code${filePath ? ` in file: ${filePath}` : ''}:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'DevFlow Code Review',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${err}`);
    }

    const data = await response.json() as OpenRouterResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI model');
    }

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse AI response: ${content.substring(0, 200)}`);
    }
  }

  static async generateSummary(reviews: { title: string; ai_score: number | null; issues_count: number }[]): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) return 'API key not configured';

    const model = await this.getModel();
    const reviewList = reviews.map(r => `- "${r.title}" (score: ${r.ai_score || 'N/A'}, issues: ${r.issues_count})`).join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'DevFlow',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a code review assistant. Generate a brief 2-3 sentence summary of the team code review activity. Be concise and actionable.' },
          { role: 'user', content: `Summarize this review activity:\n${reviewList}` },
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) return 'Unable to generate summary';
    const data = await response.json() as OpenRouterResponse;
    return data.choices[0]?.message?.content || 'No summary generated';
  }
}
