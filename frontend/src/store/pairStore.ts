import { create } from 'zustand';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  language?: string;
  isExpanded?: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  time: Date;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursorPosition?: { line: number; col: number };
  isActive: boolean;
}

export interface PairSession {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  files: FileNode[];
  activeFileId: string;
  terminal: TerminalLine[];
  participants: Participant[];
  chatMessages: { from: string; fromName: string; text: string; time: Date }[];
}

interface PairState {
  sessions: PairSession[];
  activeSessionId: string | null;

  createSession: (name: string, creatorId: string) => PairSession;
  getSession: (id: string) => PairSession | undefined;
  setActiveSession: (id: string | null) => void;
  updateSessionStatus: (id: string, status: 'active' | 'paused' | 'ended') => void;

  updateFileContent: (sessionId: string, fileId: string, content: string) => void;
  setActiveFile: (sessionId: string, fileId: string) => void;
  toggleFolder: (sessionId: string, folderId: string) => void;
  createFile: (sessionId: string, name: string, parentId?: string) => void;

  addTerminalLine: (sessionId: string, line: Omit<TerminalLine, 'id' | 'time'>) => void;
  executeCommand: (sessionId: string, command: string) => void;

  addChatMessage: (sessionId: string, from: string, fromName: string, text: string) => void;
  addParticipant: (sessionId: string, participant: Participant) => void;
  removeParticipant: (sessionId: string, participantId: string) => void;
  updateCursor: (sessionId: string, participantId: string, position: { line: number; col: number }) => void;

  simulateOtherUserTyping: (sessionId: string) => void;
}

const defaultFiles: FileNode[] = [
  {
    id: 'root', name: 'project', type: 'folder', isExpanded: true,
    children: [
      {
        id: 'src', name: 'src', type: 'folder', isExpanded: true,
        children: [
          { id: 'main-ts', name: 'main.ts', type: 'file', language: 'typescript',
            content: `import { createApp } from './app';\nimport { config } from './config';\n\nconst app = createApp(config);\n\napp.listen(config.port, () => {\n  console.log(\`Server running on port \${config.port}\`);\n  console.log('Environment:', config.env);\n});\n` },
          { id: 'app-ts', name: 'app.ts', type: 'file', language: 'typescript',
            content: `import express from 'express';\nimport cors from 'cors';\nimport { healthRouter } from './routes/health';\nimport { apiRouter } from './routes/api';\n\nexport function createApp(config: any) {\n  const app = express();\n\n  app.use(cors());\n  app.use(express.json());\n\n  app.use('/health', healthRouter);\n  app.use('/api', apiRouter);\n\n  return app;\n}\n` },
          { id: 'config-ts', name: 'config.ts', type: 'file', language: 'typescript',
            content: `export const config = {\n  port: parseInt(process.env.PORT || '3000'),\n  env: process.env.NODE_ENV || 'development',\n  db: {\n    host: process.env.DB_HOST || 'localhost',\n    port: parseInt(process.env.DB_PORT || '5432'),\n    name: process.env.DB_NAME || 'devflow',\n  },\n  jwt: {\n    secret: process.env.JWT_SECRET || 'dev-secret',\n    expiresIn: '7d',\n  },\n};\n` },
          {
            id: 'routes', name: 'routes', type: 'folder', isExpanded: false,
            children: [
              { id: 'health-ts', name: 'health.ts', type: 'file', language: 'typescript',
                content: `import { Router } from 'express';\n\nexport const healthRouter = Router();\n\nhealthRouter.get('/', (req, res) => {\n  res.json({ status: 'ok', uptime: process.uptime() });\n});\n` },
              { id: 'api-ts', name: 'api.ts', type: 'file', language: 'typescript',
                content: `import { Router } from 'express';\n\nexport const apiRouter = Router();\n\napiRouter.get('/users', (req, res) => {\n  res.json({ users: [] });\n});\n\napiRouter.get('/reviews', (req, res) => {\n  res.json({ reviews: [] });\n});\n` },
            ]
          },
        ]
      },
      { id: 'package-json', name: 'package.json', type: 'file', language: 'json',
        content: `{\n  "name": "devflow-api",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "tsx watch src/main.ts",\n    "build": "tsc",\n    "start": "node dist/main.js",\n    "test": "vitest",\n    "lint": "eslint src/"\n  },\n  "dependencies": {\n    "express": "^4.18.0",\n    "cors": "^2.8.5"\n  }\n}\n` },
      { id: 'tsconfig', name: 'tsconfig.json', type: 'file', language: 'json',
        content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs",\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true\n  },\n  "include": ["src/**/*"]\n}\n` },
      { id: 'readme', name: 'README.md', type: 'file', language: 'markdown',
        content: `# DevFlow API\n\nA modern code review platform with AI-powered analysis.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Features\n\n- Real-time code reviews\n- AI-powered issue detection\n- Team collaboration\n- Pair programming\n` },
    ]
  }
];

const otherParticipants: Participant[] = [
  { id: 'user-2', name: 'John Developer', avatar: 'J', color: '#3b82f6', isActive: true },
  { id: 'user-3', name: 'Sarah Chen', avatar: 'S', color: '#8b5cf6', isActive: false },
];

function generateId() { return Math.random().toString(36).slice(2, 10); }

function findFile(files: FileNode[], id: string): FileNode | undefined {
  for (const f of files) {
    if (f.id === id) return f;
    if (f.children) {
      const found = findFile(f.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function updateFileInTree(files: FileNode[], id: string, updates: Partial<FileNode>): FileNode[] {
  return files.map(f => {
    if (f.id === id) return { ...f, ...updates };
    if (f.children) return { ...f, children: updateFileInTree(f.children, id, updates) };
    return f;
  });
}

function addFileToTree(files: FileNode[], parentId: string | undefined, newFile: FileNode): FileNode[] {
  if (!parentId) return [...files, newFile];
  return files.map(f => {
    if (f.id === parentId && f.type === 'folder') return { ...f, children: [...(f.children || []), newFile], isExpanded: true };
    if (f.children) return { ...f, children: addFileToTree(f.children, parentId, newFile) };
    return f;
  });
}

const terminalResponses: Record<string, string[]> = {
  'npm run dev': ['$ DevFlow API starting...', '  Server running on port 3000', '  Environment: development', '  Watching for file changes...'],
  'npm run build': ['$ tsc', '  Compiling TypeScript...', '  Build complete! Output: dist/', '  No errors found.'],
  'npm test': ['$ vitest run', '  ✓ src/routes/health.test.ts (3 tests)', '  ✓ src/routes/api.test.ts (5 tests)', '  Test Files  2 passed', '  Tests      8 passed'],
  'npm run lint': ['$ eslint src/', '  No problems found', '  4 files checked'],
  'ls': ['src/', '  main.ts  app.ts  config.ts  routes/', 'package.json  tsconfig.json  README.md'],
  'pwd': ['/home/devflow/project'],
  'clear': ['__CLEAR__'],
  'help': ['Available commands:', '  npm run dev    - Start dev server', '  npm run build  - Build for production', '  npm test       - Run tests', '  npm run lint   - Lint code', '  ls, pwd, clear - Shell commands'],
};

export const usePairStore = create<PairState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  createSession: (name, creatorId) => {
    const session: PairSession = {
      id: generateId(),
      name,
      status: 'active',
      createdAt: new Date(),
      startedAt: new Date(),
      files: JSON.parse(JSON.stringify(defaultFiles)),
      activeFileId: 'main-ts',
      terminal: [
        { id: generateId(), type: 'system', text: 'Session created. Welcome to pair programming!', time: new Date() },
        { id: generateId(), type: 'system', text: 'Share the session ID to invite others.', time: new Date() },
      ],
      participants: [
        { id: creatorId, name: 'You', avatar: 'D', color: '#10b981', isActive: true },
      ],
      chatMessages: [],
    };
    set(state => ({ sessions: [...state.sessions, session], activeSessionId: session.id }));
    return session;
  },

  getSession: (id) => get().sessions.find(s => s.id === id),
  setActiveSession: (id) => set({ activeSessionId: id }),

  updateSessionStatus: (id, status) => set(state => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, status, endedAt: status === 'ended' ? new Date() : undefined } : s)
  })),

  updateFileContent: (sessionId, fileId, content) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, files: updateFileInTree(s.files, fileId, { content }) } : s)
  })),

  setActiveFile: (sessionId, fileId) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, activeFileId: fileId } : s)
  })),

  toggleFolder: (sessionId, folderId) => set(state => ({
    sessions: state.sessions.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, files: updateFileInTree(s.files, folderId, { isExpanded: !findFile(s.files, folderId)?.isExpanded }) };
    })
  })),

  createFile: (sessionId, name, parentId) => {
    const newFile: FileNode = { id: generateId(), name, type: 'file', language: name.split('.').pop(), content: '' };
    set(state => ({
      sessions: state.sessions.map(s => s.id === sessionId ? { ...s, files: addFileToTree(s.files, parentId, newFile), activeFileId: newFile.id } : s)
    }));
  },

  addTerminalLine: (sessionId, line) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, terminal: [...s.terminal, { ...line, id: generateId(), time: new Date() }] } : s)
  })),

  executeCommand: (sessionId, command) => {
    const store = get();
    store.addTerminalLine(sessionId, { type: 'input', text: `$ ${command}` });

    const cmd = command.trim().toLowerCase();
    const response = terminalResponses[cmd];

    if (cmd === 'clear') {
      set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, terminal: [] } : s)
      }));
      return;
    }

    if (response) {
      response.forEach((line, i) => {
        setTimeout(() => {
          store.addTerminalLine(sessionId, { type: 'output', text: line });
        }, i * 200);
      });
    } else {
      setTimeout(() => {
        store.addTerminalLine(sessionId, { type: 'error', text: `command not found: ${command}` });
        store.addTerminalLine(sessionId, { type: 'output', text: 'Type "help" for available commands.' });
      }, 300);
    }
  },

  addChatMessage: (sessionId, from, fromName, text) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, chatMessages: [...s.chatMessages, { from, fromName, text, time: new Date() }] } : s)
  })),

  addParticipant: (sessionId, participant) => set(state => ({
    sessions: state.sessions.map(s => {
      if (s.id !== sessionId) return s;
      if (s.participants.find(p => p.id === participant.id)) return s;
      return { ...s, participants: [...s.participants, participant] };
    })
  })),

  removeParticipant: (sessionId, participantId) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, participants: s.participants.filter(p => p.id !== participantId) } : s)
  })),

  updateCursor: (sessionId, participantId, position) => set(state => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, participants: s.participants.map(p => p.id === participantId ? { ...p, cursorPosition: position } : p) } : s)
  })),

  simulateOtherUserTyping: (sessionId) => {
    const store = get();
    const session = store.getSession(sessionId);
    if (!session) return;

    const otherUser = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
    const activeFile = findFile(session.files, session.activeFileId);
    if (!activeFile || !activeFile.content) return;

    const lines = activeFile.content.split('\n');
    const randomLine = Math.floor(Math.random() * lines.length);
    const randomCol = Math.floor(Math.random() * (lines[randomLine]?.length || 0));

    store.updateCursor(sessionId, otherUser.id, { line: randomLine, col: randomCol });

    const comments = [
      '// TODO: optimize this', '// Nice pattern here', '// Should we refactor?',
      '// Add error handling', '// This looks good!', '// Check edge cases',
    ];
    const comment = comments[Math.floor(Math.random() * comments.length)];

    setTimeout(() => {
      const s = get().getSession(sessionId);
      if (!s) return;
      const f = findFile(s.files, s.activeFileId);
      if (!f || !f.content) return;

      const newLines = f.content.split('\n');
      newLines.splice(randomLine + 1, 0, comment);
      get().updateFileContent(sessionId, s.activeFileId, newLines.join('\n'));
    }, 2000 + Math.random() * 3000);
  },
}));
