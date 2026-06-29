# DevFlow MCP Server

Trigger DevFlow AI code reviews from VS Code, Cursor, or any MCP-compatible IDE.

## Setup

### 1. Install dependencies

```bash
cd devflow-mcp
npm install
npm run build
```

### 2. Configure in VS Code

Add to `.vscode/settings.json`:

```json
{
  "mcpServers": {
    "devflow": {
      "command": "node",
      "args": ["C:/Users/Rajesh/Desktop/DevFlow/devflow-mcp/dist/server.js"],
      "env": {
        "DEVFLOW_API_URL": "http://localhost:5000",
        "DEVFLOW_TOKEN": ""
      }
    }
  }
}
```

### 3. Available Tools

| Tool | Description |
|---|---|
| `devflow_review` | Review code for issues |
| `devflow_fix` | Generate a fix for a code issue |
| `devflow_explain` | Explain code and suggest improvements |

### Usage

In VS Code with Copilot Chat or Cursor, you can:

- Select code → ask "Review this code with DevFlow"
- Select code → ask "Fix this issue: [description]"
- Select code → ask "Explain this code"

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DEVFLOW_API_URL` | DevFlow backend URL | `http://localhost:5000` |
| `DEVFLOW_TOKEN` | API authentication token | `""` |
