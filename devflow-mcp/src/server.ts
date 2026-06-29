import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DevFlowClient } from './client.js';

const API_URL = process.env.DEVFLOW_API_URL || 'http://localhost:5000';
const TOKEN = process.env.DEVFLOW_TOKEN || '';

const client = new DevFlowClient(API_URL, TOKEN);

const server = new Server(
  { name: 'devflow-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'devflow_review',
      description: 'Review code for issues using DevFlow AI',
      inputSchema: {
        type: 'object' as const,
        properties: {
          code: { type: 'string', description: 'Code to review' },
          language: { type: 'string', description: 'Programming language (e.g. typescript, python)' },
          persona: { type: 'string', description: 'Review persona: strict, security, performance, friendly, junior' },
        },
        required: ['code'],
      },
    },
    {
      name: 'devflow_fix',
      description: 'Generate a fix for a code issue',
      inputSchema: {
        type: 'object' as const,
        properties: {
          code: { type: 'string', description: 'Original code with the issue' },
          issue: { type: 'string', description: 'Description of the issue to fix' },
        },
        required: ['code', 'issue'],
      },
    },
    {
      name: 'devflow_explain',
      description: 'Explain code and suggest improvements',
      inputSchema: {
        type: 'object' as const,
        properties: {
          code: { type: 'string', description: 'Code to explain' },
        },
        required: ['code'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'devflow_review': {
        const result = await client.reviewCode(
          (args as any).code,
          (args as any).language,
          (args as any).persona
        );
        return { content: [{ type: 'text', text: formatReview(result) }] };
      }
      case 'devflow_fix': {
        const result = await client.suggestFix(
          (args as any).code,
          (args as any).issue
        );
        return { content: [{ type: 'text', text: formatFix(result) }] };
      }
      case 'devflow_explain': {
        const result = await client.explainCode((args as any).code);
        return { content: [{ type: 'text', text: result }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

function formatReview(result: any): string {
  let text = `## DevFlow AI Review\n\n**Score:** ${result.score}/100\n\n`;
  if (!result.issues || result.issues.length === 0) {
    text += '✅ No issues found!\n';
    return text;
  }
  text += `Found ${result.issues.length} issue(s):\n\n`;
  for (const issue of result.issues) {
    const emoji = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : issue.severity === 'medium' ? '🟡' : '🔵';
    text += `${emoji} **${issue.severity.toUpperCase()}** — ${issue.description}\n`;
    if (issue.suggestion) text += `> 💡 ${issue.suggestion}\n`;
    text += '\n';
  }
  return text;
}

function formatFix(result: any): string {
  return `## Suggested Fix\n\n**Explanation:** ${result.explanation}\n\n### Fixed Code\n\`\`\`\n${result.fixed_code}\n\`\`\``;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DevFlow MCP server running on stdio');
}

main().catch(console.error);
