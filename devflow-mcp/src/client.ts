export class DevFlowClient {
  private apiUrl: string;
  private token: string;

  constructor(apiUrl: string, token: string) {
    this.apiUrl = apiUrl;
    this.token = token;
  }

  private async request(path: string, body: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DevFlow API error: ${error}`);
    }
    return response.json();
  }

  async reviewCode(code: string, language?: string, persona?: string) {
    // Use OpenRouter directly for MCP reviews
    const result = await this.request('/api/v1/analysis/review', {
      code,
      language: language || 'unknown',
      persona: persona || 'strict',
    });
    return result;
  }

  async suggestFix(code: string, issue: string) {
    const result = await this.request('/api/v1/analysis/fix', {
      code,
      issue,
    });
    return result;
  }

  async explainCode(code: string) {
    const result = await this.request('/api/v1/analysis/explain', {
      code,
    });
    return result.explanation || result.summary || 'No explanation available.';
  }
}
