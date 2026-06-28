import express from 'express';
import cors from 'cors';
import http from 'http';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

import { createAuthRouter } from './routes/auth';
import { createReviewRouter } from './routes/reviews';
import { createCommentRouter } from './routes/comments';
import { createAnalysisRouter } from './routes/analysis';
import { createNotificationRouter } from './routes/notifications';
import { createAnalyticsRouter } from './routes/analytics';
import { createRepositoryRouter } from './routes/repositories';
import { createSessionRouter } from './routes/sessions';
import settingsRouter from './routes/settings';
import { RealtimeService } from './services/RealtimeService';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './db/prisma';
import logger from './utils/logger';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

const now = new Date();
const d = (hoursBack: number) => new Date(Date.now() - hoursBack * 3600000);
const mockDb: any = {
  users: [
    { id: 'user-1', email: 'demo@devflow.ai', username: 'demo', password_hash: '$2a$10$t9avLjgxzINW/I.V3TPoledIwBrBu6W2bidLHwmoUPdN0OQlZfdUK', full_name: 'Demo User', avatar_url: null, role: 'admin', created_at: d(720), updated_at: now, is_active: true, last_login: d(1), preferences: { theme: 'dark' }, bio: 'Full-stack developer & team lead' },
    { id: 'user-2', email: 'john@devflow.ai', username: 'john_dev', password_hash: '$2a$10$t9avLjgxzINW/I.V3TPoledIwBrBu6W2bidLHwmoUPdN0OQlZfdUK', full_name: 'John Developer', avatar_url: null, role: 'lead', created_at: d(720), updated_at: now, is_active: true, last_login: d(2), preferences: { theme: 'dark' }, bio: 'Senior backend engineer' },
    { id: 'user-3', email: 'sarah@devflow.ai', username: 'sarah_codes', password_hash: '$2a$10$t9avLjgxzINW/I.V3TPoledIwBrBu6W2bidLHwmoUPdN0OQlZfdUK', full_name: 'Sarah Chen', avatar_url: null, role: 'reviewer', created_at: d(500), updated_at: now, is_active: true, last_login: d(5), preferences: {}, bio: 'Security-focused code reviewer' },
    { id: 'user-4', email: 'mike@devflow.ai', username: 'mike_dev', password_hash: '$2a$10$t9avLjgxzINW/I.V3TPoledIwBrBu6W2bidLHwmoUPdN0OQlZfdUK', full_name: 'Mike Rodriguez', avatar_url: null, role: 'contributor', created_at: d(300), updated_at: now, is_active: true, last_login: d(8), preferences: {}, bio: 'Frontend specialist' },
  ],
  reviews: [
    { id: 'review-1', repo_id: 'repo-1', title: 'Add user authentication flow', description: 'Implements JWT-based auth with refresh tokens, password hashing, and session management', author_id: 'user-1', status: 'open', branch_name: 'feature/auth', base_branch: 'main', files_changed: 8, additions: 420, deletions: 120, ai_score: 4.5, complexity_score: 6, priority: 'high', created_at: d(3), updated_at: d(1), merged_at: null, metadata: {}, code_files: [{ name: 'src/auth.ts', content: 'import jwt from "jsonwebtoken";\nimport bcrypt from "bcryptjs";\n\nexport class AuthService {\n  async login(email: string, password: string) {\n    const user = await this.findUser(email);\n    if (!user) throw new Error("User not found");\n    const valid = await bcrypt.compare(password, user.password_hash);\n    if (!valid) throw new Error("Invalid password");\n    return this.generateTokens(user);\n  }\n\n  async register(email: string, password: string) {\n    const hash = await bcrypt.hash(password, 10);\n    return this.createUser({ email, password_hash: hash });\n  }\n\n  generateTokens(user: any) {\n    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET);\n    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });\n    return { accessToken, refreshToken };\n  }\n}' }, { name: 'src/middleware/auth.ts', content: 'import { Request, Response, NextFunction } from "express";\nimport jwt from "jsonwebtoken";\n\nexport const authMiddleware = (req: Request, res: Response, next: NextFunction) => {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "No token" });\n  try {\n    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n    req.userId = decoded.id;\n    next();\n  } catch {\n    res.status(401).json({ error: "Invalid token" });\n  }\n};' }] },
    { id: 'review-2', repo_id: 'repo-1', title: 'Fix database connection pooling', description: 'Optimize PostgreSQL connection pool settings to prevent connection exhaustion under load', author_id: 'user-2', status: 'approved', branch_name: 'fix/db-pool', base_branch: 'main', files_changed: 3, additions: 85, deletions: 30, ai_score: 4.8, complexity_score: 4, priority: 'critical', created_at: d(24), updated_at: d(4), merged_at: d(3), metadata: {}, code_files: [{ name: 'src/db/pool.ts', content: 'import { Pool } from "pg";\n\nconst pool = new Pool({\n  max: 20,\n  idleTimeoutMillis: 30000,\n  connectionTimeoutMillis: 2000,\n});\n\nexport default pool;' }] },
    { id: 'review-3', repo_id: 'repo-1', title: 'Refactor API error handling', description: 'Centralize error handling with proper HTTP status codes and structured error responses', author_id: 'user-1', status: 'draft', branch_name: 'refactor/errors', base_branch: 'main', files_changed: 12, additions: 310, deletions: 200, ai_score: 0, complexity_score: 0, priority: 'medium', created_at: d(48), updated_at: d(12), merged_at: null, metadata: {}, code_files: [] },
    { id: 'review-4', repo_id: 'repo-1', title: 'Implement rate limiting middleware', description: 'Add rate limiting using token bucket algorithm to protect API endpoints', author_id: 'user-3', status: 'open', branch_name: 'feature/rate-limit', base_branch: 'main', files_changed: 5, additions: 180, deletions: 15, ai_score: 4.2, complexity_score: 3, priority: 'high', created_at: d(6), updated_at: d(2), merged_at: null, metadata: {}, code_files: [{ name: 'src/middleware/rateLimiter.ts', content: 'const tokens = new Map<string, { count: number; lastRefill: number }>();\n\nexport const rateLimiter = (maxTokens: number, refillRate: number) => {\n  return (req, res, next) => {\n    const key = req.ip;\n    const now = Date.now();\n    const bucket = tokens.get(key) || { count: maxTokens, lastRefill: now };\n    const elapsed = now - bucket.lastRefill;\n    bucket.count = Math.min(maxTokens, bucket.count + (elapsed / 1000) * refillRate);\n    bucket.lastRefill = now;\n    if (bucket.count < 1) return res.status(429).json({ error: "Too many requests" });\n    bucket.count--;\n    tokens.set(key, bucket);\n    next();\n  };\n};' }] },
    { id: 'review-5', repo_id: 'repo-1', title: 'Add GraphQL API support', description: 'Implement GraphQL endpoint alongside REST API for flexible data queries', author_id: 'user-4', status: 'changes_requested', branch_name: 'feature/graphql', base_branch: 'main', files_changed: 15, additions: 890, deletions: 45, ai_score: 3.8, complexity_score: 8, priority: 'low', created_at: d(36), updated_at: d(10), merged_at: null, metadata: {}, code_files: [{ name: 'src/graphql/schema.ts', content: 'import { gql } from "apollo-server-express";\n\nexport const typeDefs = gql`\n  type Query {\n    reviews: [Review!]!\n    review(id: ID!): Review\n  }\n  type Review {\n    id: ID!\n    title: String!\n    status: String!\n    author: User!\n  }\n  type User {\n    id: ID!\n    username: String!\n  }\n`;' }] },
    { id: 'review-6', repo_id: 'repo-1', title: 'Migrate to React 18 concurrent mode', description: 'Update frontend to leverage React 18 concurrent features and Suspense', author_id: 'user-4', status: 'merged', branch_name: 'chore/react18', base_branch: 'main', files_changed: 22, additions: 650, deletions: 420, ai_score: 4.6, complexity_score: 7, priority: 'medium', created_at: d(72), updated_at: d(48), merged_at: d(48), metadata: {}, code_files: [] },
    { id: 'review-7', repo_id: 'repo-1', title: 'Security audit fixes', description: 'Address OWASP top 10 vulnerabilities found in security audit', author_id: 'user-3', status: 'open', branch_name: 'fix/security-audit', base_branch: 'main', files_changed: 18, additions: 520, deletions: 380, ai_score: 4.9, complexity_score: 9, priority: 'critical', created_at: d(4), updated_at: d(1), merged_at: null, metadata: {}, code_files: [{ name: 'src/db/queries.ts', content: '// SECURITY: SQL injection vulnerability\nconst query = `SELECT * FROM users WHERE id = ${userId}`;\n\n// FIX: Use parameterized query\nconst safeQuery = "SELECT * FROM users WHERE id = $1";\nconst result = await pool.query(safeQuery, [userId]);' }, { name: 'src/api/users.ts', content: 'import express from "express";\n\nconst router = express.Router();\n\nrouter.post("/users", async (req, res) => {\n  const { email, username } = req.body;\n  // Missing input validation!\n  const user = await createUser({ email, username });\n  res.json(user);\n});\n\nexport default router;' }] },
  ],
  comments: [
    { id: 'c-1', review_id: 'review-1', author_id: 'user-2', author_username: 'john_dev', author_avatar: null, file_path: 'src/auth.ts', line_number: 42, content: 'Consider adding rate limiting here to prevent brute force attacks', is_suggestion: true, suggestion_text: 'Use express-rate-limit middleware with a max of 5 attempts per minute', thread_id: null, resolved: false, created_at: d(2), updated_at: d(2) },
    { id: 'c-2', review_id: 'review-1', author_id: 'user-2', author_username: 'john_dev', author_avatar: null, file_path: null, line_number: null, content: 'Great implementation! The refresh token rotation is well done.', is_suggestion: false, suggestion_text: null, thread_id: null, resolved: false, created_at: d(1.5), updated_at: d(1.5) },
    { id: 'c-3', review_id: 'review-1', author_id: 'user-3', author_username: 'sarah_codes', author_avatar: null, file_path: 'src/auth.ts', line_number: 78, content: 'We should add CSRF protection for cookie-based auth', is_suggestion: true, suggestion_text: 'Add csurf middleware and validate Origin header', thread_id: null, resolved: true, created_at: d(1), updated_at: d(1) },
    { id: 'c-4', review_id: 'review-4', author_id: 'user-1', author_username: 'demo', author_avatar: null, file_path: 'src/middleware/rateLimiter.ts', line_number: 15, content: 'Should we use Redis for distributed rate limiting?', is_suggestion: false, suggestion_text: null, thread_id: null, resolved: false, created_at: d(5), updated_at: d(5) },
    { id: 'c-5', review_id: 'review-4', author_id: 'user-3', author_username: 'sarah_codes', author_avatar: null, file_path: 'src/middleware/rateLimiter.ts', line_number: 15, content: 'Yes, Redis would be better for multi-instance deployments. For now the in-memory approach works for single instance.', is_suggestion: false, suggestion_text: null, thread_id: 'c-4', resolved: false, created_at: d(4), updated_at: d(4) },
    { id: 'c-6', review_id: 'review-5', author_id: 'user-1', author_username: 'demo', author_avatar: null, file_path: 'src/graphql/schema.ts', line_number: 32, content: 'We should add query complexity analysis to prevent expensive queries', is_suggestion: true, suggestion_text: 'Use graphql-query-complexity package to limit query depth and complexity', thread_id: null, resolved: false, created_at: d(12), updated_at: d(12) },
    { id: 'c-7', review_id: 'review-7', author_id: 'user-1', author_username: 'demo', author_avatar: null, file_path: null, line_number: null, content: 'We need to prioritize the SQL injection fix - it affects production', is_suggestion: false, suggestion_text: null, thread_id: null, resolved: false, created_at: d(3), updated_at: d(3) },
    { id: 'c-8', review_id: 'review-7', author_id: 'user-2', author_username: 'john_dev', author_avatar: null, file_path: 'src/db/queries.ts', line_number: 45, content: 'Already working on parameterized queries for all DB operations', is_suggestion: false, suggestion_text: null, thread_id: null, resolved: false, created_at: d(2), updated_at: d(2) },
    { id: 'c-9', review_id: 'review-2', author_id: 'user-1', author_username: 'demo', author_avatar: null, file_path: 'src/db/pool.ts', line_number: 8, content: 'Nice work on the pool config! The max connections calculation looks correct.', is_suggestion: false, suggestion_text: null, thread_id: null, resolved: false, created_at: d(10), updated_at: d(10) },
    { id: 'c-10', review_id: 'review-6', author_id: 'user-2', author_username: 'john_dev', author_avatar: null, file_path: 'src/components/App.tsx', line_number: 1, content: 'The Suspense boundaries look great. Consider adding a loading skeleton.', is_suggestion: true, suggestion_text: 'Create a reusable Skeleton component with shimmer animation', thread_id: null, resolved: true, created_at: d(50), updated_at: d(50) },
  ],
  issues: [
    { id: 'i-1', review_id: 'review-1', issue_type: 'security', severity: 'critical', file_path: 'src/auth.ts', line_number: 23, description: 'JWT secret hardcoded in source code. Use environment variables instead.', suggestion: 'Move JWT_SECRET to .env file and validate it at startup', ai_generated: true, status: 'open', created_at: d(2) },
    { id: 'i-2', review_id: 'review-1', issue_type: 'performance', severity: 'high', file_path: 'src/auth.ts', line_number: 67, description: 'N+1 query detected in user lookup. Batch queries needed.', suggestion: 'Use IN clause or JOIN to fetch users in a single query', ai_generated: true, status: 'open', created_at: d(2) },
    { id: 'i-3', review_id: 'review-1', issue_type: 'style', severity: 'low', file_path: 'src/auth.ts', line_number: 15, description: 'Debug console.log statement left in production code', suggestion: 'Remove console.log or replace with logger.debug', ai_generated: true, status: 'fixed', created_at: d(2) },
    { id: 'i-4', review_id: 'review-4', issue_type: 'bug', severity: 'medium', file_path: 'src/middleware/rateLimiter.ts', line_number: 42, description: 'Race condition in token bucket replenish logic', suggestion: 'Use atomic operations or a lock mechanism', ai_generated: true, status: 'open', created_at: d(5) },
    { id: 'i-5', review_id: 'review-4', issue_type: 'documentation', severity: 'low', file_path: 'src/middleware/rateLimiter.ts', line_number: 1, description: 'Missing JSDoc documentation for the RateLimiter class', suggestion: 'Add comprehensive JSDoc comments', ai_generated: false, status: 'acknowledged', created_at: d(4) },
    { id: 'i-6', review_id: 'review-5', issue_type: 'performance', severity: 'high', file_path: 'src/graphql/resolvers.ts', line_number: 89, description: 'No query complexity analysis - complex nested queries could overload the server', suggestion: 'Implement query complexity limits using graphql-query-complexity', ai_generated: true, status: 'open', created_at: d(10) },
    { id: 'i-7', review_id: 'review-5', issue_type: 'security', severity: 'high', file_path: 'src/graphql/schema.ts', line_number: 15, description: 'Missing input validation for GraphQL mutations', suggestion: 'Add validation layer for all mutation inputs', ai_generated: false, status: 'open', created_at: d(8) },
    { id: 'i-8', review_id: 'review-7', issue_type: 'security', severity: 'critical', file_path: 'src/db/queries.ts', line_number: 23, description: 'SQL injection vulnerability in user query - string concatenation used', suggestion: 'Convert to parameterized query with $1 placeholder', ai_generated: true, status: 'open', created_at: d(3) },
    { id: 'i-9', review_id: 'review-7', issue_type: 'security', severity: 'critical', file_path: 'src/api/users.ts', line_number: 45, description: 'Missing input sanitization on user input fields', suggestion: 'Add express-validator or Joi validation schemas', ai_generated: true, status: 'open', created_at: d(3) },
    { id: 'i-10', review_id: 'review-7', issue_type: 'security', severity: 'high', file_path: 'src/api/users.ts', line_number: 67, description: 'Password reset token has no expiration', suggestion: 'Set token expiry to 15 minutes', ai_generated: true, status: 'open', created_at: d(3) },
  ],
  notifications: [
    { id: 'n-1', user_id: 'user-1', type: 'review_assigned', title: 'Security audit review assigned', content: 'Review #7 "Security audit fixes" needs your review — 10 critical issues found', review_id: 'review-7', is_read: false, created_at: d(4) },
    { id: 'n-2', user_id: 'user-1', type: 'comment_reply', title: 'John replied to your review', content: 'John commented on "Add user authentication flow"', review_id: 'review-1', is_read: false, created_at: d(1.5) },
    { id: 'n-3', user_id: 'user-1', type: 'status_change', title: 'Review approved', content: '"Fix DB connection pooling" was approved and merged', review_id: 'review-2', is_read: true, created_at: d(3) },
    { id: 'n-4', user_id: 'user-1', type: 'achievement_unlocked', title: '🏆 100 Reviews Milestone', content: 'Congratulations! You have completed 100 code reviews. You are a review champion!', review_id: null, is_read: false, created_at: d(12) },
    { id: 'n-5', user_id: 'user-1', type: 'learning_recommended', title: 'AI recommends: Advanced TypeScript', content: 'Based on your review patterns, try "Advanced TypeScript Patterns" path', review_id: null, is_read: true, created_at: d(24) },
    { id: 'n-6', user_id: 'user-2', type: 'review_assigned', title: 'Review assigned: Rate limiting', content: 'Please review the rate limiting middleware implementation', review_id: 'review-4', is_read: false, created_at: d(5) },
    { id: 'n-7', user_id: 'user-3', type: 'comment_reply', title: 'Demo replied to your thread', content: 'Demo responded to your question about Redis rate limiting', review_id: 'review-4', is_read: false, created_at: d(4) },
  ],
  team_analytics: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    total_reviews: Math.floor(Math.random() * 8) + 1,
    total_comments: Math.floor(Math.random() * 20) + 5,
    avg_ai_score: +(3 + Math.random() * 2).toFixed(2),
    avg_review_time_hours: +(Math.random() * 16).toFixed(1),
    high_risk_files: Math.floor(Math.random() * 4),
    members_active: Math.floor(Math.random() * 3) + 2
  })),
  sessions: [] as any[]
};

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('/api/v1/auth', createAuthRouter(mockDb));
app.use('/api/v1/reviews', createReviewRouter(mockDb));
app.use('/api/v1', createCommentRouter(mockDb));
app.use('/api/v1', createAnalysisRouter(mockDb));
app.use('/api/v1/notifications', createNotificationRouter(mockDb));
app.use('/api/v1/analytics', createAnalyticsRouter(mockDb));
app.use('/api/v1/repositories', createRepositoryRouter(mockDb));
app.use('/api/v1/sessions', createSessionRouter(mockDb));
app.use('/api/v1/settings', settingsRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next);
});

const realtimeService = new RealtimeService(httpServer, mockDb);

async function seedDatabase() {
  const hash = await bcrypt.hash('demo123', 10);

  for (const u of mockDb.users) {
    u.password_hash = hash;
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        username: u.username,
        password_hash: hash,
        full_name: u.full_name,
        role: u.role,
        bio: u.bio,
        is_active: u.is_active,
      },
    });
  }

  await prisma.repository.upsert({
    where: { id: 'repo-1' },
    update: {},
    create: {
      id: 'repo-1',
      name: 'devflow-app',
      owner_id: 'user-1',
      primary_language: 'TypeScript',
      description: 'AI-powered code review platform',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'openrouter_model' },
    update: {},
    create: { key: 'openrouter_model', value: 'google/gemini-2.0-flash-001' },
  });

  logger.info('Database seeded with demo data');
}

async function start() {
  try {
    await seedDatabase();
  } catch (err: any) {
    logger.warn('Seeding warning: ' + err.message);
  }

  httpServer.listen(PORT, () => {
    logger.info(`DevFlow API running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info('Demo account: demo@devflow.ai / demo123');
  });
}

start();

export { app, httpServer, mockDb, realtimeService };
