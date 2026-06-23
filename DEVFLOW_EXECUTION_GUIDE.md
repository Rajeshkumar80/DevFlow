# DevFlow: Step-by-Step Execution Guide
## Production-Ready Implementation Roadmap

---


# PRE-DEVELOPMENT SETUP

## Tools You Need
- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- Git
- Visual Studio Code (or Cursor)
- Postman (API testing)
- Figma (design reference, optional)

## System Requirements
- 8GB RAM minimum (16GB recommended)
- 50GB disk space
- Internet connection

## Initial Environment

```bash
# 1. Create project root
mkdir devflow && cd devflow
git init

# 2. Create folder structure
mkdir frontend backend docs .github
mkdir -p .github/workflows

# 3. Initialize Git
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: project structure"
```

## Create Docker Compose for Local Development

**File: `docker-compose.yml`**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: devflow_dev
      POSTGRES_USER: devflow_user
      POSTGRES_PASSWORD: dev_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devflow_user -d devflow_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Run it:**
```bash
docker-compose up -d
# Verify connections:
psql -h localhost -U devflow_user -d devflow_dev -c "SELECT NOW();"
redis-cli ping  # Should return PONG
```

---

# PHASE 1: FOUNDATION (WEEKS 1-2)

## Week 1: Backend Setup + Authentication

### Day 1-2: Project Initialization

```bash
cd backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express cors dotenv jsonwebtoken bcryptjs pg redis socket.io winston

# Install dev dependencies
npm install -D typescript ts-node @types/node @types/express nodemon jest @types/jest supertest

# Initialize TypeScript
npx tsc --init

# Create folder structure
mkdir -p src/{routes,services,middleware,db,types,utils,tests}
mkdir -p src/db/{migrations,seeds}
```

**Create `tsconfig.json` (if not auto-generated properly):**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "ts-node -r tsconfig-paths/register src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "migrate": "ts-node src/db/migrate.ts",
    "seed": "ts-node src/db/seed.ts"
  }
}
```

### Day 3-4: Database Schema & Migrations

**File: `src/db/schema.sql`**

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'contributor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, slug)
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

-- Repositories
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  github_repo_id BIGINT,
  github_url TEXT,
  primary_language VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Code reviews
CREATE TABLE IF NOT EXISTS code_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft',
  branch_name VARCHAR(255),
  base_branch VARCHAR(255) DEFAULT 'main',
  files_changed INT DEFAULT 0,
  ai_score DECIMAL(3,2),
  priority VARCHAR(50) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review comments
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES code_reviews(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  file_path VARCHAR(500),
  line_number INT,
  content TEXT NOT NULL,
  is_suggestion BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_reviews_repo_status ON code_reviews(repo_id, status);
CREATE INDEX idx_reviews_author ON code_reviews(author_id, created_at DESC);
CREATE INDEX idx_comments_review ON review_comments(review_id, created_at);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**File: `src/db/migrate.ts`**

```typescript
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev'
});

async function migrate() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ Database migrated successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

**Run migrations:**
```bash
DATABASE_URL="postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev" npm run migrate
```

### Day 5-6: Authentication Service

**File: `src/types/index.ts`**

```typescript
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: 'admin' | 'lead' | 'reviewer' | 'contributor' | 'guest';
  avatar_url?: string;
  created_at: Date;
  is_active: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  username: string;
  full_name?: string;
}
```

**File: `src/services/AuthService.ts`**

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { User, JWTPayload } from '../types';

export class AuthService {
  constructor(private db: Pool) {}

  async register(email: string, username: string, password: string, fullName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await this.db.query(
      `INSERT INTO users (email, username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, full_name, role, avatar_url, created_at, is_active`,
      [email, username, hashedPassword, fullName || null, 'contributor']
    );

    return result.rows[0];
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in Redis (optional, for better security)
    // await redis.set(`refresh_token:${user.id}`, refreshToken, 'EX', 30 * 24 * 60 * 60);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        is_active: user.is_active
      },
      accessToken,
      refreshToken
    };
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
  }
}
```

**File: `src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

export const authMiddleware = (db: any) => {
  const authService = new AuthService(db);

  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

**File: `src/routes/auth.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Pool } from 'pg';

export function createAuthRouter(db: Pool) {
  const router = Router();
  const authService = new AuthService(db);

  // Register
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, username, password, full_name } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await authService.register(email, username, password, full_name);
      res.status(201).json({ user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const { user, accessToken, refreshToken } = await authService.login(email, password);
      res.status(200).json({ user, accessToken, refreshToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  // Refresh Token
  router.post('/refresh', (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const decoded = authService.verifyToken(refreshToken);
      
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      res.status(200).json({ accessToken: newAccessToken });
    } catch (err: any) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  return router;
}
```

### Day 7: Main Server Setup

**File: `src/index.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createAuthRouter } from './routes/auth';
import { authMiddleware } from './middleware/auth';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev'
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', createAuthRouter(db));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 DevFlow API running on http://localhost:${PORT}`);
});

export { app, db };
```

**Create `.env` file:**

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
ANTHROPIC_API_KEY=your-api-key-here
```

**Start the server:**

```bash
npm run dev
# Should output: 🚀 DevFlow API running on http://localhost:5000
```

### Test Auth Endpoints (using Postman/curl):

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "username": "devuser",
    "password": "SecurePass123!",
    "full_name": "Dev User"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Week 2: Core Review Features

### Day 8-9: Review Service & CRUD Endpoints

**File: `src/services/ReviewService.ts`**

```typescript
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class ReviewService {
  constructor(private db: Pool) {}

  async createReview(
    repoId: string,
    title: string,
    description: string,
    authorId: string,
    branchName: string,
    baseBranch: string = 'main'
  ) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO code_reviews (id, repo_id, title, description, author_id, branch_name, base_branch, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, repoId, title, description, authorId, branchName, baseBranch, 'draft']
    );
    return result.rows[0];
  }

  async getReview(reviewId: string) {
    const result = await this.db.query(
      'SELECT * FROM code_reviews WHERE id = $1',
      [reviewId]
    );
    return result.rows[0];
  }

  async listReviews(repoId: string, status?: string, limit = 20, offset = 0) {
    let query = 'SELECT * FROM code_reviews WHERE repo_id = $1';
    const params: any[] = [repoId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async updateReviewStatus(reviewId: string, status: string) {
    const result = await this.db.query(
      'UPDATE code_reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, reviewId]
    );
    return result.rows[0];
  }

  async deleteReview(reviewId: string) {
    await this.db.query('DELETE FROM code_reviews WHERE id = $1', [reviewId]);
  }
}
```

**File: `src/routes/reviews.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';

export function createReviewRouter(db: Pool) {
  const router = Router();
  const reviewService = new ReviewService(db);
  const auth = authMiddleware(db);

  // Create review
  router.post('/:repoId', auth, async (req: Request, res: Response) => {
    try {
      const { title, description, branchName, baseBranch } = req.body;
      const review = await reviewService.createReview(
        req.params.repoId,
        title,
        description,
        req.userId!,
        branchName,
        baseBranch || 'main'
      );
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // List reviews
  router.get('/:repoId', async (req: Request, res: Response) => {
    try {
      const { status, limit = '20', offset = '0' } = req.query;
      const reviews = await reviewService.listReviews(
        req.params.repoId,
        status as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(reviews);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get review
  router.get('/:repoId/:reviewId', async (req: Request, res: Response) => {
    try {
      const review = await reviewService.getReview(req.params.reviewId);
      if (!review) return res.status(404).json({ error: 'Review not found' });
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update status
  router.patch('/:repoId/:reviewId/status', auth, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const review = await reviewService.updateReviewStatus(req.params.reviewId, status);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete review
  router.delete('/:repoId/:reviewId', auth, async (req: Request, res: Response) => {
    try {
      await reviewService.deleteReview(req.params.reviewId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
```

Update `src/index.ts` to include reviews router:

```typescript
import { createReviewRouter } from './routes/reviews';

// Add to routes section:
app.use('/api/v1/reviews', createReviewRouter(db));
```

### Day 10-11: Comments Service

**File: `src/services/CommentService.ts`**

```typescript
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class CommentService {
  constructor(private db: Pool) {}

  async addComment(
    reviewId: string,
    authorId: string,
    filePath: string,
    lineNumber: number,
    content: string,
    isSuggestion: boolean = false
  ) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO review_comments (id, review_id, author_id, file_path, line_number, content, is_suggestion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, reviewId, authorId, filePath, lineNumber, content, isSuggestion]
    );
    return result.rows[0];
  }

  async getComments(reviewId: string) {
    const result = await this.db.query(
      `SELECT rc.*, u.username, u.avatar_url 
       FROM review_comments rc
       JOIN users u ON rc.author_id = u.id
       WHERE rc.review_id = $1
       ORDER BY rc.created_at ASC`,
      [reviewId]
    );
    return result.rows;
  }

  async resolveComment(commentId: string) {
    const result = await this.db.query(
      'UPDATE review_comments SET resolved = true WHERE id = $1 RETURNING *',
      [commentId]
    );
    return result.rows[0];
  }

  async deleteComment(commentId: string) {
    await this.db.query('DELETE FROM review_comments WHERE id = $1', [commentId]);
  }
}
```

**File: `src/routes/comments.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { CommentService } from '../services/CommentService';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';

export function createCommentRouter(db: Pool) {
  const router = Router();
  const commentService = new CommentService(db);
  const auth = authMiddleware(db);

  router.post('/:reviewId/comments', auth, async (req: Request, res: Response) => {
    try {
      const { filePath, lineNumber, content, isSuggestion } = req.body;
      const comment = await commentService.addComment(
        req.params.reviewId,
        req.userId!,
        filePath,
        lineNumber,
        content,
        isSuggestion || false
      );
      res.status(201).json(comment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:reviewId/comments', async (req: Request, res: Response) => {
    try {
      const comments = await commentService.getComments(req.params.reviewId);
      res.json(comments);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.patch('/:reviewId/comments/:commentId/resolve', auth, async (req: Request, res: Response) => {
    try {
      const comment = await commentService.resolveComment(req.params.commentId);
      res.json(comment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:reviewId/comments/:commentId', auth, async (req: Request, res: Response) => {
    try {
      await commentService.deleteComment(req.params.commentId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
```

Add to `src/index.ts`:
```typescript
import { createCommentRouter } from './routes/comments';
app.use('/api/v1', createCommentRouter(db));
```

### Day 12-14: Write Tests

**File: `src/tests/auth.test.ts`**

```typescript
import request from 'supertest';
import { app, db } from '../index';

describe('Authentication', () => {
  afterAll(async () => {
    await db.end();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });

  it('should fail login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });

    expect(response.status).toBe(401);
  });
});
```

**Run tests:**
```bash
npm test
```

---

# PHASE 2: CORE FEATURES (WEEKS 3-4)

## Week 3: Code Diff Viewer & Advanced Features

### Day 15-16: Diff Engine

Install diff library:
```bash
npm install diff2html simple-git
```

**File: `src/services/DiffService.ts`**

```typescript
import { simpleGit } from 'simple-git';
import { diff2htmlCompare } from 'diff2html';

export class DiffService {
  async computeDiff(repoPath: string, baseBranch: string, targetBranch: string) {
    const git = simpleGit(repoPath);
    
    const diffOutput = await git.diff([baseBranch, targetBranch]);
    
    // Parse diff
    const htmlDiff = diff2htmlCompare(
      '',
      diffOutput,
      { drawFileList: true, matching: 'lines', outputFormat: 'json' }
    );

    return htmlDiff;
  }

  async getFileDiff(repoPath: string, filePath: string, baseBranch: string, targetBranch: string) {
    const git = simpleGit(repoPath);
    const diff = await git.diff([baseBranch, targetBranch, '--', filePath]);
    return diff;
  }
}
```

### Day 17-18: Repository Management

**File: `src/services/RepositoryService.ts`**

```typescript
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class RepositoryService {
  constructor(private db: Pool) {}

  async createRepository(orgId: string, name: string, githubRepoId?: number, githubUrl?: string, language?: string) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO repositories (id, org_id, name, github_repo_id, github_url, primary_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, orgId, name, githubRepoId || null, githubUrl || null, language || null]
    );
    return result.rows[0];
  }

  async getRepository(repoId: string) {
    const result = await this.db.query(
      'SELECT * FROM repositories WHERE id = $1',
      [repoId]
    );
    return result.rows[0];
  }

  async listRepositories(orgId: string) {
    const result = await this.db.query(
      'SELECT * FROM repositories WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return result.rows;
  }

  async updateRepositoryMetadata(repoId: string, metadata: any) {
    const result = await this.db.query(
      `UPDATE repositories 
       SET synced_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [repoId]
    );
    return result.rows[0];
  }
}
```

### Day 19-21: Advanced Review Features

**Add to database schema:**

```sql
-- Code issues detection
CREATE TABLE IF NOT EXISTS code_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES code_reviews(id) ON DELETE CASCADE,
  issue_type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  file_path VARCHAR(500),
  line_number INT,
  description TEXT,
  suggestion TEXT,
  ai_generated BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**File: `src/services/IssueService.ts`**

```typescript
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class IssueService {
  constructor(private db: Pool) {}

  async createIssue(
    reviewId: string,
    issueType: string,
    severity: string,
    description: string,
    filePath?: string,
    lineNumber?: number,
    suggestion?: string,
    aiGenerated: boolean = false
  ) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO code_issues (id, review_id, issue_type, severity, file_path, line_number, description, suggestion, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, reviewId, issueType, severity, filePath || null, lineNumber || null, description, suggestion || null, aiGenerated]
    );
    return result.rows[0];
  }

  async getIssuesForReview(reviewId: string) {
    const result = await this.db.query(
      `SELECT * FROM code_issues 
       WHERE review_id = $1 
       ORDER BY severity DESC, created_at ASC`,
      [reviewId]
    );
    return result.rows;
  }

  async updateIssueStatus(issueId: string, status: string) {
    const result = await this.db.query(
      'UPDATE code_issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, issueId]
    );
    return result.rows[0];
  }
}
```

---

# PHASE 3: AI INTEGRATION (WEEKS 5-6)

## Week 5: Claude API Integration

### Day 22-23: Code Analysis with Claude

Install Anthropic SDK:
```bash
npm install @anthropic-ai/sdk
```

**File: `src/services/CodeAnalysisService.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { IssueService } from './IssueService';

export class CodeAnalysisService {
  private client: Anthropic;
  private issueService: IssueService;

  constructor(private db: Pool) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.issueService = new IssueService(db);
  }

  async analyzeCode(code: string, language: string, filePath: string, reviewId: string) {
    const prompt = `You are an expert code reviewer. Analyze the following ${language} code and identify:
1. Critical bugs or security vulnerabilities
2. Performance issues
3. Code quality problems
4. Best practice violations
5. Test coverage gaps

Provide structured feedback in JSON format with:
{
  "issues": [
    {
      "type": "bug|security|performance|style|documentation|test",
      "severity": "low|medium|high|critical",
      "line": <line_number>,
      "description": "<description>",
      "suggestion": "<fix_suggestion>"
    }
  ],
  "overallScore": <0-5>,
  "summary": "<brief_summary>"
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // Store issues in database
    for (const issue of analysisResult.issues) {
      await this.issueService.createIssue(
        reviewId,
        issue.type,
        issue.severity,
        issue.description,
        filePath,
        issue.line,
        issue.suggestion,
        true // AI generated
      );
    }

    // Update review with AI score
    await this.db.query(
      'UPDATE code_reviews SET ai_score = $1, complexity_score = $2 WHERE id = $3',
      [analysisResult.overallScore, (analysisResult.overallScore * 2), reviewId]
    );

    return analysisResult;
  }

  async generateSuggestions(code: string, language: string, issueType: string) {
    const prompt = `As a ${language} expert, provide refactoring suggestions for this code to address ${issueType} issues:

\`\`\`${language}
${code}
\`\`\`

Provide your response in JSON:
{
  "refactoringSuggestions": ["<suggestion1>", "<suggestion2>", ...],
  "improvedCode": "<improved_code_block>",
  "explanation": "<why_this_is_better>"
}`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }
}
```

### Day 24-25: Code Analysis Endpoint

**File: `src/routes/analysis.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { CodeAnalysisService } from '../services/CodeAnalysisService';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';

export function createAnalysisRouter(db: Pool) {
  const router = Router();
  const analysisService = new CodeAnalysisService(db);
  const auth = authMiddleware(db);

  // Analyze code
  router.post('/:reviewId/analyze', auth, async (req: Request, res: Response) => {
    try {
      const { code, language, filePath } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: 'Missing code or language' });
      }

      const analysis = await analysisService.analyzeCode(code, language, filePath, req.params.reviewId);
      res.json(analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get suggestions
  router.post('/:reviewId/suggestions', auth, async (req: Request, res: Response) => {
    try {
      const { code, language, issueType } = req.body;
      const suggestions = await analysisService.generateSuggestions(code, language, issueType);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
```

Add to `src/index.ts`:
```typescript
import { createAnalysisRouter } from './routes/analysis';
app.use('/api/v1', createAnalysisRouter(db));
```

### Day 26-28: Batch Analysis with Job Queue

Install Bull (job queue):
```bash
npm install bull
```

**File: `src/services/AnalysisQueue.ts`**

```typescript
import Bull from 'bull';
import { Pool } from 'pg';
import { CodeAnalysisService } from './CodeAnalysisService';
import * as redis from 'redis';

export class AnalysisQueue {
  private queue: Bull.Queue;
  private analysisService: CodeAnalysisService;

  constructor(private db: Pool) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.queue = new Bull('code-analysis', redisUrl);
    this.analysisService = new CodeAnalysisService(db);

    this.setupProcessors();
  }

  private setupProcessors() {
    this.queue.process(async (job) => {
      const { reviewId, files } = job.data;

      for (const file of files) {
        await this.analysisService.analyzeCode(
          file.content,
          file.language,
          file.path,
          reviewId
        );
        job.progress(Math.round((files.indexOf(file) / files.length) * 100));
      }

      return { success: true };
    });

    this.queue.on('completed', (job) => {
      console.log(`✅ Analysis job ${job.id} completed`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ Analysis job ${job.id} failed:`, err.message);
    });
  }

  async addAnalysisJob(reviewId: string, files: any[]) {
    const job = await this.queue.add(
      { reviewId, files },
      {
        priority: 1,
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 }
      }
    );
    return job.id;
  }

  async getJobProgress(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      progress: job.progress(),
      state: await job.getState(),
      attempts: job.attemptsMade,
      data: job.data
    };
  }
}
```

---

# PHASE 4: REAL-TIME FEATURES (WEEKS 7-8)

## Week 7: WebSocket Setup & Real-Time Sync

### Day 29-30: Socket.io Server

**File: `src/services/RealtimeService.ts`**

```typescript
import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Pool } from 'pg';

export class RealtimeService {
  private io: Server;

  constructor(httpServer: HTTPServer, private db: Pool) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      // Verify token
      // If valid, continue; else reject
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ User connected: ${socket.id}`);

      // Join review room
      socket.on('review:join', (reviewId: string) => {
        socket.join(`review:${reviewId}`);
        this.io.to(`review:${reviewId}`).emit('review:user:join', { userId: socket.id });
      });

      // Code change (real-time sync)
      socket.on('review:code:change', (data: any) => {
        const { reviewId, filePath, content, cursor } = data;
        this.io.to(`review:${reviewId}`).emit('review:code:change', {
          filePath,
          content,
          cursor,
          userId: socket.id
        });
      });

      // Comment added
      socket.on('review:comment:add', async (data: any) => {
        const { reviewId, comment } = data;
        // Save to DB
        this.io.to(`review:${reviewId}`).emit('review:comment:add', comment);
      });

      // Pair session events
      socket.on('session:code:change', (data: any) => {
        const { sessionId, content, cursor } = data;
        socket.to(`session:${sessionId}`).emit('session:code:change', {
          content,
          cursor,
          userId: socket.id
        });
      });

      socket.on('session:terminal:output', (data: any) => {
        const { sessionId, output } = data;
        this.io.to(`session:${sessionId}`).emit('session:terminal:output', output);
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });
    });
  }

  getIO(): Server {
    return this.io;
  }
}
```

### Day 31-32: Update Main Server with HTTP + WebSocket

**File: `src/index.ts` (Updated)**

```typescript
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Pool } from 'pg';
import { createAuthRouter } from './routes/auth';
import { createReviewRouter } from './routes/reviews';
import { createCommentRouter } from './routes/comments';
import { createAnalysisRouter } from './routes/analysis';
import { authMiddleware } from './middleware/auth';
import { RealtimeService } from './services/RealtimeService';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Database
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Real-time service
const realtimeService = new RealtimeService(httpServer, db);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', createAuthRouter(db));
app.use('/api/v1/reviews', createReviewRouter(db));
app.use('/api/v1', createCommentRouter(db));
app.use('/api/v1', createAnalysisRouter(db));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 DevFlow API with WebSocket running on http://localhost:${PORT}`);
});

export { app, httpServer, db, realtimeService };
```

---

# PHASE 5: FRONTEND UI (WEEKS 9-12)

## Week 9: Frontend Setup & Design System

### Day 33-35: React Project Setup

```bash
cd frontend
npx create-react-app devflow-client --template typescript
cd devflow-client

npm install react-router-dom axios socket.io-client
npm install @reduxjs/toolkit react-redux react-query
npm install tailwindcss -D framer-motion @monaco-editor/react
npm install recharts zod zustand
npm install lucide-react # Icons
```

**Initialize Tailwind:**
```bash
npx tailwindcss init -p
```

**File: `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          400: '#94a3b8',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        },
        cyan: {
          500: '#06b6d4',
          600: '#0891b2',
        },
        rose: {
          500: '#f43f5e',
          600: '#e11d48',
        },
        cream: {
          50: '#faf8f3',
          100: '#f5f3f0',
        },
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.3s cubic-bezier(0.23, 1, 0.320, 1)',
        fadeIn: 'fadeIn 0.2s ease',
      },
    },
  },
  plugins: [],
}
```

### Day 36-37: Dashboard Component

**File: `src/components/Dashboard.tsx`**

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, PlusIcon } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cream-50">Your Dashboard</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-cream-50 rounded-lg transition-colors">
            <PlusIcon size={18} />
            New Review
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8"
      >
        {/* Stats Row */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            { label: 'Active Reviews', value: '12', color: 'emerald' },
            { label: 'Pending Approval', value: '5', color: 'amber' },
            { label: 'Team Members', value: '8', color: 'cyan' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
            >
              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold text-${stat.color}-500`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Active Reviews */}
        <motion.section variants={itemVariants} className="mb-8">
          <h2 className="text-xl font-bold text-cream-50 mb-4">Active Reviews</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ backgroundColor: '#1e293b' }}
                className="border-b border-slate-700 p-6 flex items-center justify-between hover:cursor-pointer transition-colors last:border-b-0"
              >
                <div className="flex-1">
                  <h3 className="text-cream-50 font-semibold mb-1">
                    Fix: Optimize database query in user service
                  </h3>
                  <p className="text-slate-400 text-sm">Author: john_dev • 2 hours ago</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                    Approved
                  </span>
                  <ChevronRightIcon className="text-slate-400" size={20} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};
```

### Day 38-40: Code Review Detail & Diff Viewer

**File: `src/components/CodeDiffViewer.tsx`**

```typescript
import React from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';

interface CodeDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language: string;
  filePath: string;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  modifiedCode,
  language,
  filePath,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800"
    >
      {/* File Header */}
      <div className="bg-slate-700/50 px-6 py-3 border-b border-slate-700">
        <p className="text-cream-100 font-mono text-sm">{filePath}</p>
      </div>

      {/* Diff Container */}
      <div className="grid grid-cols-2 h-96">
        {/* Original */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="border-r border-slate-700"
        >
          <div className="bg-rose-500/10 px-4 py-2 border-b border-slate-700">
            <p className="text-rose-400 text-xs font-semibold">ORIGINAL</p>
          </div>
          <Editor
            height="100%"
            language={language}
            value={originalCode}
            theme="vs-dark"
            options={{ readOnly: true, minimap: { enabled: false } }}
          />
        </motion.div>

        {/* Modified */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-emerald-500/10 px-4 py-2 border-b border-slate-700">
            <p className="text-emerald-400 text-xs font-semibold">MODIFIED</p>
          </div>
          <Editor
            height="100%"
            language={language}
            value={modifiedCode}
            theme="vs-dark"
            options={{ readOnly: true, minimap: { enabled: false } }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
```

### Day 41-42: Pair Programming Component

**File: `src/components/PairProgrammingSession.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { VideoIcon, PhoneOffIcon } from 'lucide-react';

interface PairSessionProps {
  socket: Socket;
  sessionId: string;
}

export const PairProgrammingSession: React.FC<PairSessionProps> = ({ socket, sessionId }) => {
  const [code, setCode] = useState('// Start coding...');
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    // Join session
    socket.emit('session:join', { sessionId });

    // Listen for code changes
    socket.on('session:code:change', (data) => {
      setCode(data.content);
    });

    socket.on('session:user:join', (data) => {
      setParticipants(prev => [...prev, data]);
    });

    return () => {
      socket.off('session:code:change');
      socket.off('session:user:join');
    };
  }, [socket, sessionId]);

  const handleCodeChange = (value: string | undefined) => {
    if (value) {
      setCode(value);
      socket.emit('session:code:change', {
        sessionId,
        content: value,
      });
    }
  };

  return (
    <div className="h-screen bg-slate-900 grid grid-cols-4">
      {/* Code Editor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="col-span-3"
      >
        <Editor
          height="100%"
          language="javascript"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'Fira Code',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
          }}
        />
      </motion.div>

      {/* Participants */}
      <motion.aside
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 border-l border-slate-700 p-6 flex flex-col"
      >
        <h3 className="text-cream-50 font-bold mb-6">Participants</h3>
        <div className="flex-1 space-y-4">
          {participants.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-slate-700 rounded-lg"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full mb-2"></div>
              <p className="text-cream-100 text-sm font-semibold">{p.name}</p>
              <p className="text-slate-400 text-xs">Active</p>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-3">
          <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-cream-50 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <VideoIcon size={18} />
            Video
          </button>
          <button className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-cream-50 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <PhoneOffIcon size={18} />
            End Session
          </button>
        </div>
      </motion.aside>
    </div>
  );
};
```

---

# PHASE 6-8: REMAINING PHASES (DETAILED IN MAIN PRD)

*(Weeks 13-16: Integrations, Testing, Deployment)*

Due to token limits, see the main **DEVFLOW_PRD.md** for complete details on:
- Week 13-14: GitHub/Slack/Jira integrations
- Week 15: End-to-end testing with Cypress
- Week 16: Deployment to AWS, monitoring setup

---

# QUICK START SUMMARY

```bash
# 1. Clone & setup
git clone <repo>
cd devflow
docker-compose up -d

# 2. Backend
cd backend
npm install
npm run migrate
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm start

# 4. Test
Backend: http://localhost:5000/health
Frontend: http://localhost:3000
API Docs: http://localhost:5000/api/docs (optional, add Swagger later)
```

---

# SUCCESS METRICS

✅ **Week 1-2:** Auth working, first API endpoints  
✅ **Week 3-4:** Code reviews CRUD, comments system  
✅ **Week 5-6:** Claude AI integration, issue detection  
✅ **Week 7-8:** Real-time WebSocket, pair programming basics  
✅ **Week 9-12:** Beautiful React UI with animations  
✅ **Week 13-14:** GitHub/Slack integrations  
✅ **Week 15:** Comprehensive testing  
✅ **Week 16:** Production-ready deployment  

**Final Result:** A production-grade SaaS platform that showcases:
- Full-stack mastery (Node.js + React)
- Real-time architecture (WebSockets)
- AI integration (Claude API)
- DevOps (Docker, GitHub Actions, AWS)
- Modern UI/UX (Tailwind, Framer Motion)

**Placement Value:** This single project = placement-ready engineer. 🚀

---

*Ready to build? Start with Step 1 and commit every milestone to GitHub. Make your repo public—this is your portfolio!*
