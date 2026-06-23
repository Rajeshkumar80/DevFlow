import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, Server, Shield, Zap, ChevronRight, Lightbulb, Target, Flame, Star, CheckCircle, ArrowUpRight, Clock, Award, Sparkles, Play, Check } from 'lucide-react';

const skillCategories = [
  { name: 'TypeScript', icon: Code, level: 'Advanced', progress: 85, color: 'bg-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', iconColor: 'text-primary-600 dark:text-primary-400', hours: 48, projects: 12 },
  { name: 'React', icon: Code, level: 'Advanced', progress: 78, color: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', iconColor: 'text-cyan-600 dark:text-cyan-400', hours: 42, projects: 8 },
  { name: 'Node.js', icon: Server, level: 'Intermediate', progress: 62, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400', hours: 35, projects: 6 },
  { name: 'PostgreSQL', icon: Server, level: 'Intermediate', progress: 55, color: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400', hours: 28, projects: 4 },
  { name: 'Security', icon: Shield, level: 'Beginner', progress: 30, color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', iconColor: 'text-rose-600 dark:text-rose-400', hours: 15, projects: 2 },
  { name: 'Performance', icon: Zap, level: 'Intermediate', progress: 45, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400', hours: 22, projects: 3 },
];

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  rating: number;
  lessons: Lesson[];
}

const initialLearningPaths: LearningPath[] = [
  {
    id: 'ts-advanced',
    title: 'Advanced TypeScript Patterns',
    category: 'TypeScript',
    difficulty: 'Advanced',
    rating: 4.8,
    lessons: [
      { id: 'ts-1', title: 'Conditional Types Deep Dive', description: 'Learn how to create types that depend on conditions, enabling powerful type transformations.', duration: '25 min', completed: true },
      { id: 'ts-2', title: 'Mapped Types & Utility Types', description: 'Master built-in utility types and create your own mapped types for type manipulation.', duration: '30 min', completed: true },
      { id: 'ts-3', title: 'Template Literal Types', description: 'Use template literal types to create precise string patterns and improve API design.', duration: '20 min', completed: true },
      { id: 'ts-4', title: 'Discriminated Unions', description: 'Implement type-safe state machines and event handling with discriminated unions.', duration: '35 min', completed: true },
      { id: 'ts-5', title: 'Branded Types', description: 'Create unique types to prevent accidental misuse of similar primitive types.', duration: '20 min', completed: true },
      { id: 'ts-6', title: 'Type Guards & Assertions', description: 'Write custom type guards to narrow types at runtime with type safety.', duration: '25 min', completed: true },
      { id: 'ts-7', title: 'Generic Constraints', description: 'Use constraints to limit generic types and create more precise abstractions.', duration: '30 min', completed: true },
      { id: 'ts-8', title: 'Recursive Types', description: 'Model complex data structures like trees and nested objects with recursive types.', duration: '35 min', completed: true },
      { id: 'ts-9', title: 'Type Inference Strategies', description: 'Understand how TypeScript infers types and leverage inference for cleaner code.', duration: '25 min', completed: false },
      { id: 'ts-10', title: 'Advanced Interface Patterns', description: 'Combine interfaces with mixins, declaration merging, and module augmentation.', duration: '30 min', completed: false },
      { id: 'ts-11', title: 'Type-Level Programming', description: 'Build type-level programs that compute types from other types at compile time.', duration: '40 min', completed: false },
      { id: 'ts-12', title: 'Project: Type-Safe API Layer', description: 'Build a complete type-safe API client using all advanced patterns learned.', duration: '45 min', completed: false },
    ],
  },
  {
    id: 'react-perf',
    title: 'React Performance Optimization',
    category: 'React',
    difficulty: 'Intermediate',
    rating: 4.6,
    lessons: [
      { id: 'rp-1', title: 'React.memo & useMemo', description: 'Prevent unnecessary re-renders and memoize expensive computations.', duration: '30 min', completed: true },
      { id: 'rp-2', title: 'useCallback Patterns', description: 'Optimize callback references to prevent child component re-renders.', duration: '25 min', completed: true },
      { id: 'rp-3', title: 'Virtualization', description: 'Render large lists efficiently using virtual scrolling techniques.', duration: '35 min', completed: true },
      { id: 'rp-4', title: 'Code Splitting', description: 'Lazy load components and routes to reduce initial bundle size.', duration: '30 min', completed: false },
      { id: 'rp-5', title: 'Profiling Tools', description: 'Use React DevTools Profiler to identify and fix performance bottlenecks.', duration: '25 min', completed: false },
      { id: 'rp-6', title: 'Bundle Analysis', description: 'Analyze and optimize your bundle with webpack-bundle-analyzer.', duration: '20 min', completed: false },
      { id: 'rp-7', title: 'Concurrent Features', description: 'Leverage Suspense and concurrent rendering for better UX.', duration: '35 min', completed: false },
      { id: 'rp-8', title: 'State Management Perf', description: 'Optimize Redux/Zustand stores and selectors for performance.', duration: '30 min', completed: false },
      { id: 'rp-9', title: 'Image Optimization', description: 'Implement lazy loading, responsive images, and WebP format.', duration: '25 min', completed: false },
      { id: 'rp-10', title: 'Project: Perf Audit', description: 'Complete performance audit of a sample application with fixes.', duration: '40 min', completed: false },
    ],
  },
  {
    id: 'db-design',
    title: 'Database Design & Optimization',
    category: 'Databases',
    difficulty: 'Intermediate',
    rating: 4.7,
    lessons: [
      { id: 'db-1', title: 'Normalization Principles', description: 'Understand 1NF, 2NF, 3NF and when to denormalize for performance.', duration: '30 min', completed: false },
      { id: 'db-2', title: 'Indexing Strategies', description: 'Create effective indexes to speed up queries without over-indexing.', duration: '35 min', completed: false },
      { id: 'db-3', title: 'Query Optimization', description: 'Analyze query plans and rewrite slow queries for better performance.', duration: '40 min', completed: false },
      { id: 'db-4', title: 'Connection Pooling', description: 'Configure and optimize database connection pools for scalability.', duration: '25 min', completed: false },
      { id: 'db-5', title: 'Migrations Best Practices', description: 'Design safe, reversible database migrations for production systems.', duration: '30 min', completed: false },
      { id: 'db-6', title: 'Data Modeling Patterns', description: 'Learn common patterns like audit logs, soft deletes, and temporal data.', duration: '35 min', completed: false },
      { id: 'db-7', title: 'PostgreSQL Advanced Features', description: 'Master JSONB, CTEs, window functions, and PostgreSQL-specific optimizations.', duration: '45 min', completed: false },
      { id: 'db-8', title: 'Database Testing', description: 'Write reliable database tests with fixtures, factories, and isolation.', duration: '30 min', completed: false },
      { id: 'db-9', title: 'Caching Strategies', description: 'Implement Redis caching with invalidation patterns for database queries.', duration: '35 min', completed: false },
      { id: 'db-10', title: 'Replication & Sharding', description: 'Understand read replicas, sharding strategies, and distributed databases.', duration: '40 min', completed: false },
      { id: 'db-11', title: 'Monitoring & Alerting', description: 'Set up database monitoring, slow query logging, and performance alerts.', duration: '25 min', completed: false },
      { id: 'db-12', title: 'Backup & Recovery', description: 'Implement automated backups, point-in-time recovery, and disaster planning.', duration: '30 min', completed: false },
      { id: 'db-13', title: 'Security Best Practices', description: 'Protect your database with encryption, access control, and audit logging.', duration: '30 min', completed: false },
      { id: 'db-14', title: 'Scaling Patterns', description: 'Scale your database with read replicas, caching, and connection pooling.', duration: '35 min', completed: false },
      { id: 'db-15', title: 'Project: Schema Design', description: 'Design a complete database schema for a real-world application.', duration: '50 min', completed: false },
    ],
  },
  {
    id: 'api-security',
    title: 'API Security Best Practices',
    category: 'Security',
    difficulty: 'Beginner',
    rating: 4.5,
    lessons: [
      { id: 'as-1', title: 'Authentication Basics', description: 'Understand JWT, OAuth 2.0, and session-based authentication.', duration: '30 min', completed: true },
      { id: 'as-2', title: 'Authorization Patterns', description: 'Implement role-based access control (RBAC) and permission systems.', duration: '35 min', completed: true },
      { id: 'as-3', title: 'Input Validation', description: 'Validate and sanitize all user inputs to prevent injection attacks.', duration: '25 min', completed: false },
      { id: 'as-4', title: 'SQL Injection Prevention', description: 'Learn techniques to protect against SQL injection vulnerabilities.', duration: '30 min', completed: false },
      { id: 'as-5', title: 'XSS Protection', description: 'Implement Content Security Policy and output encoding to prevent XSS.', duration: '25 min', completed: false },
      { id: 'as-6', title: 'Rate Limiting', description: 'Protect APIs from abuse with rate limiting and throttling strategies.', duration: '20 min', completed: false },
      { id: 'as-7', title: 'CORS Configuration', description: 'Properly configure Cross-Origin Resource Sharing for your APIs.', duration: '15 min', completed: false },
      { id: 'as-8', title: 'Project: Secure API', description: 'Build a fully secured API with all security best practices applied.', duration: '40 min', completed: false },
    ],
  },
  {
    id: 'system-design',
    title: 'System Design Fundamentals',
    category: 'Architecture',
    difficulty: 'Advanced',
    rating: 4.9,
    lessons: [
      { id: 'sd-1', title: 'Scalability Concepts', description: 'Learn horizontal vs vertical scaling, load balancing, and distribution.', duration: '40 min', completed: false },
      { id: 'sd-2', title: 'Caching Strategies', description: 'Implement Redis, Memcached, and CDN caching for high-performance systems.', duration: '35 min', completed: false },
      { id: 'sd-3', title: 'Message Queues', description: 'Use Kafka, RabbitMQ, and SQS for async communication between services.', duration: '45 min', completed: false },
      { id: 'sd-4', title: 'Microservices Patterns', description: 'Design microservices with service mesh, API gateway, and circuit breakers.', duration: '50 min', completed: false },
      { id: 'sd-5', title: 'Database Design at Scale', description: 'Choose between SQL, NoSQL, and NewSQL based on your requirements.', duration: '40 min', completed: false },
      { id: 'sd-6', title: 'CAP Theorem', description: 'Understand consistency, availability, and partition tolerance trade-offs.', duration: '30 min', completed: false },
      { id: 'sd-7', title: 'Event-Driven Architecture', description: 'Build event-sourced systems with CQRS and event streaming.', duration: '45 min', completed: false },
      { id: 'sd-8', title: 'API Design Principles', description: 'Design RESTful and GraphQL APIs that scale and are easy to consume.', duration: '35 min', completed: false },
      { id: 'sd-9', title: 'Observability', description: 'Implement logging, monitoring, tracing, and alerting for distributed systems.', duration: '40 min', completed: false },
      { id: 'sd-10', title: 'Disaster Recovery', description: 'Plan for failures with redundancy, failover, and backup strategies.', duration: '35 min', completed: false },
      { id: 'sd-11', title: 'Cost Optimization', description: 'Optimize cloud costs with right-sizing, spot instances, and reserved capacity.', duration: '30 min', completed: false },
      { id: 'sd-12', title: 'Security Architecture', description: 'Design secure systems with defense in depth and zero trust principles.', duration: '40 min', completed: false },
      { id: 'sd-13', title: 'Performance Engineering', description: 'Optimize system performance with profiling, benchmarking, and tuning.', duration: '35 min', completed: false },
      { id: 'sd-14', title: 'Interview Preparation', description: 'Practice common system design interview questions and frameworks.', duration: '45 min', completed: false },
      { id: 'sd-15', title: 'Case Study: Chat System', description: 'Design a real-time chat system like WhatsApp or Slack from scratch.', duration: '50 min', completed: false },
      { id: 'sd-16', title: 'Case Study: E-commerce', description: 'Design a scalable e-commerce platform handling millions of users.', duration: '50 min', completed: false },
      { id: 'sd-17', title: 'Case Study: Social Feed', description: 'Design a social media feed like Twitter or Instagram with real-time updates.', duration: '50 min', completed: false },
      { id: 'sd-18', title: 'Case Study: Video Streaming', description: 'Design a video streaming platform like YouTube or Netflix.', duration: '50 min', completed: false },
      { id: 'sd-19', title: 'Case Study: Ride Sharing', description: 'Design a ride-sharing service like Uber or Lyft with real-time matching.', duration: '50 min', completed: false },
      { id: 'sd-20', title: 'Final Project: System Design', description: 'Design a complete system architecture for your own project idea.', duration: '60 min', completed: false },
    ],
  },
  {
    id: 'graphql-guide',
    title: 'GraphQL Complete Guide',
    category: 'API',
    difficulty: 'Intermediate',
    rating: 4.4,
    lessons: [
      { id: 'gql-1', title: 'GraphQL Basics', description: 'Understand queries, mutations, subscriptions, and the GraphQL schema.', duration: '30 min', completed: false },
      { id: 'gql-2', title: 'Schema Design', description: 'Design intuitive and maintainable GraphQL schemas with best practices.', duration: '35 min', completed: false },
      { id: 'gql-3', title: 'Resolvers & Data Sources', description: 'Implement efficient resolvers and connect to various data sources.', duration: '40 min', completed: false },
      { id: 'gql-4', title: 'Authentication & Authorization', description: 'Secure your GraphQL API with proper auth patterns and directives.', duration: '35 min', completed: false },
      { id: 'gql-5', title: 'Error Handling', description: 'Handle errors gracefully with unions, error types, and custom scalars.', duration: '30 min', completed: false },
      { id: 'gql-6', title: 'Performance Optimization', description: 'Optimize queries with DataLoader, batching, and cursor pagination.', duration: '40 min', completed: false },
      { id: 'gql-7', title: 'Testing GraphQL', description: 'Write unit and integration tests for your GraphQL API.', duration: '35 min', completed: false },
      { id: 'gql-8', title: 'Client Integration', description: 'Integrate GraphQL with React using Apollo Client or urql.', duration: '40 min', completed: false },
      { id: 'gql-9', title: 'Subscriptions', description: 'Implement real-time updates with GraphQL subscriptions.', duration: '30 min', completed: false },
      { id: 'gql-10', title: 'Federation', description: 'Build a federated GraphQL gateway for microservices architecture.', duration: '45 min', completed: false },
      { id: 'gql-11', title: 'Code Generation', description: 'Use GraphQL codegen to generate types and resolvers automatically.', duration: '25 min', completed: false },
      { id: 'gql-12', title: 'Security Best Practices', description: 'Protect against query complexity attacks, introspection, and injection.', duration: '30 min', completed: false },
      { id: 'gql-13', title: 'Migration from REST', description: 'Migrate an existing REST API to GraphQL incrementally.', duration: '40 min', completed: false },
      { id: 'gql-14', title: 'Project: Full Stack App', description: 'Build a complete full-stack application with GraphQL backend and React frontend.', duration: '55 min', completed: false },
    ],
  },
];

const weeklyStreak = [
  { day: 'Mon', done: true, reviews: 3 },
  { day: 'Tue', done: true, reviews: 5 },
  { day: 'Wed', done: true, reviews: 2 },
  { day: 'Thu', done: false, reviews: 0 },
  { day: 'Fri', done: true, reviews: 4 },
  { day: 'Sat', done: false, reviews: 0 },
  { day: 'Sun', done: false, reviews: 0 },
];

const suggestions = [
  { title: 'Learn SQL Injection Prevention', reason: 'Found 2 security issues in recent reviews', category: 'Security', priority: 'high', icon: Shield, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10',
    content: 'SQL injection is one of the most critical security vulnerabilities. Attackers can manipulate SQL queries to access, modify, or delete unauthorized data.',
    steps: ['Use parameterized queries or prepared statements', 'Validate and sanitize all user inputs', 'Apply least privilege principle to database accounts', 'Use ORM frameworks when possible', 'Regularly audit database permissions'],
    resources: ['OWASP SQL Injection Prevention Cheat Sheet', 'PortSwigger SQL Injection Labs', 'SQL Injection Prevention in Node.js'] },
  { title: 'Master React Memo & useMemo', reason: 'Performance issues detected in 3 reviews', category: 'Performance', priority: 'high', icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10',
    content: 'React re-renders components when props change. useMemo and React.memo help prevent unnecessary re-renders by caching expensive computations and component outputs.',
    steps: ['Wrap expensive computations with useMemo', 'Use React.memo for pure components', 'Avoid creating new objects/arrays in render', 'Profile with React DevTools before optimizing', 'Don\'t over-memo — measure first'],
    resources: ['React Official Docs: useMemo', 'When to useMemo and useCallback', 'React.memo vs useMemo comparison'] },
  { title: 'Practice TypeScript Generics', reason: 'Type safety improvements needed', category: 'TypeScript', priority: 'medium', icon: Code, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10',
    content: 'Generics allow you to write reusable, type-safe code. They let you create components and functions that work with any type while maintaining type information.',
    steps: ['Start with simple generic functions', 'Learn generic constraints with extends', 'Practice generic interfaces and classes', 'Use utility types (Partial, Pick, Omit)', 'Build a generic API client'],
    resources: ['TypeScript Generics Handbook', 'Total TypeScript Generics Course', 'Generics in React patterns'] },
  { title: 'Study Database Indexing', reason: 'N+1 queries found in code reviews', category: 'Databases', priority: 'medium', icon: Server, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10',
    content: 'Proper indexing dramatically improves query performance. Without indexes, databases must scan entire tables. But over-indexing slows down writes.',
    steps: ['Identify slow queries with EXPLAIN ANALYZE', 'Create indexes on frequently queried columns', 'Use composite indexes for multi-column queries', 'Monitor index usage and remove unused ones', 'Learn about covering indexes'],
    resources: ['PostgreSQL Indexing Guide', 'Use The Index, Luke', 'Database Indexing Best Practices'] },
  { title: 'Learn Error Boundary Patterns', reason: 'Improve error handling in React apps', category: 'React', priority: 'low', icon: Code, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    content: 'Error boundaries catch JavaScript errors in their child component tree. They prevent the entire app from crashing and can show fallback UI.',
    steps: ['Create a generic ErrorBoundary component', 'Wrap feature routes in error boundaries', 'Add error logging service integration', 'Design meaningful fallback UIs', 'Test error scenarios'],
    resources: ['React Error Handling Docs', 'Error Boundary patterns', 'react-error-boundary library'] },
  { title: 'Explore WebSocket Best Practices', reason: 'Enhance real-time features', category: 'Architecture', priority: 'low', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    content: 'WebSockets enable real-time, bidirectional communication. They\'re essential for chat apps, live notifications, collaborative editing, and gaming.',
    steps: ['Implement reconnection logic', 'Add heartbeat/ping-pong mechanism', 'Handle connection state properly', 'Scale with Redis pub/sub', 'Add authentication to WebSocket connections'],
    resources: ['MDN WebSocket API', 'Socket.IO Documentation', 'WebSocket vs SSE comparison'] },
];

const resources = [
  { title: 'TypeScript Handbook', type: 'Documentation', url: '#', icon: BookOpen },
  { title: 'React Patterns', type: 'Article', url: '#', icon: Code },
  { title: 'Node.js Best Practices', type: 'Guide', url: '#', icon: Server },
  { title: 'OWASP Top 10', type: 'Security', url: '#', icon: Shield },
];

const goals = [
  { title: 'Complete 5 code reviews this week', progress: 3, total: 5, type: 'reviews' },
  { title: 'Finish TypeScript learning path', progress: 8, total: 12, type: 'lessons' },
  { title: 'Study 10 hours this month', progress: 7, total: 10, type: 'hours' },
  { title: 'Fix 5 security issues', progress: 2, total: 5, type: 'issues' },
];

export const LearningPage = () => {
  const [activeTab, setActiveTab] = useState<'skills' | 'paths' | 'suggestions'>('skills');
  const [paths, setPaths] = useState<LearningPath[]>(initialLearningPaths);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ pathId: string; lessonId: string } | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const currentStreak: number = 5;
  const totalHours = skillCategories.reduce((a, s) => a + s.hours, 0);
  const avgProgress = Math.round(skillCategories.reduce((a, s) => a + s.progress, 0) / skillCategories.length);

  const toggleLesson = (pathId: string, lessonId: string) => {
    setPaths(prev => prev.map(p => {
      if (p.id !== pathId) return p;
      return {
        ...p,
        lessons: p.lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l),
      };
    }));
  };

  const getPathCompleted = (path: LearningPath) => path.lessons.filter(l => l.completed).length;

  const openLesson = (pathId: string, lessonId: string) => {
    setActiveLesson({ pathId, lessonId });
  };

  const closeLesson = () => setActiveLesson(null);

  const activeLessonData = activeLesson ? paths.find(p => p.id === activeLesson.pathId)?.lessons.find(l => l.id === activeLesson.lessonId) : null;
  const activePathData = activeLesson ? paths.find(p => p.id === activeLesson.pathId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Learning & Growth</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your skills, streaks, and learning progress</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Day Streak', value: `${currentStreak} days`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { icon: Clock, label: 'Total Hours', value: `${totalHours}h`, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/10' },
          { icon: Target, label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: Award, label: 'Skills Learned', value: skillCategories.length, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-2`}><stat.icon size={16} /></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Streak */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Activity</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
            <Flame size={12} className="text-orange-500" />
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">{currentStreak}</span>
            <span className="text-[10px] text-orange-500 dark:text-orange-400">day{currentStreak !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {weeklyStreak.map((day, i) => {
            const maxHeight = 100;
            const barHeight = day.done ? Math.max((day.reviews / 5) * maxHeight, 15) : 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full flex flex-col items-center justify-end flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}px` }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 15 }}
                    className={`w-full max-w-[36px] rounded-t-md ${day.done ? 'bg-gradient-to-t from-orange-600 to-orange-400 dark:from-orange-500 dark:to-orange-300 shadow-lg shadow-orange-500/20' : 'bg-gray-200 dark:bg-dark-surface'}`}
                  />
                </div>
                <span className={`text-[11px] font-medium mt-2 ${day.done ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>{day.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-btn w-fit">
        {[
          { id: 'skills', label: 'Skills', icon: Code },
          { id: 'paths', label: 'Learning Paths', icon: BookOpen },
          { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <motion.div key="skills" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Radar-like visual */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Skill Overview</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {skillCategories.map((skill, i) => (
                  <motion.div key={skill.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-dark-surface" />
                        <motion.circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={176} initial={{ strokeDashoffset: 176 }} animate={{ strokeDashoffset: 176 - (skill.progress / 100) * 176 }} transition={{ duration: 1, delay: i * 0.1 }} className={skill.iconColor} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{skill.progress}%</span>
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{skill.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{skill.level}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Detailed Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillCategories.map((skill, i) => (
                <motion.div key={skill.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-4 shadow-card hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${skill.bg} ${skill.iconColor}`}><skill.icon size={18} /></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white text-[13px]">{skill.name}</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{skill.level}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark-surface rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }} transition={{ delay: 0.3 + i * 0.05 }} className={`h-full rounded-full ${skill.color}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>{skill.hours}h studied</span>
                    <span>{skill.projects} projects</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <motion.div key="paths" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3">
            {paths.map((path, i) => {
              const completed = getPathCompleted(path);
              const progress = Math.round((completed / path.lessons.length) * 100);
              const isExpanded = expandedPathId === path.id;
              return (
                <motion.div key={path.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card overflow-hidden">
                  {/* Path Header */}
                  <button onClick={() => setExpandedPathId(isExpanded ? null : path.id)} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      {progress === 100 ? <CheckCircle size={16} className="text-emerald-500" /> : <Play size={16} className="text-primary-600 dark:text-primary-400 ml-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-[13px] truncate">{path.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          path.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                          path.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}>{path.difficulty}</span>
                        {progress === 100 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {completed}/{path.lessons.length} lessons</span>
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {path.rating}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-100 dark:bg-dark-surface rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: 0.3, duration: 0.5 }} className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" />
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{progress}%</span>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </motion.div>
                  </button>

                  {/* Expanded Lessons */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-dark-border px-4 py-3 space-y-1">
                          {path.lessons.map((lesson, li) => (
                            <motion.div key={lesson.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: li * 0.02 }} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer group ${lesson.completed ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : 'hover:bg-gray-50 dark:hover:bg-dark-surface'}`} onClick={() => openLesson(path.id, lesson.id)}>
                              <button onClick={(e) => { e.stopPropagation(); toggleLesson(path.id, lesson.id); }} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${lesson.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'}`}>
                                {lesson.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[12px] font-medium truncate ${lesson.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{lesson.title}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{lesson.description}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1"><Clock size={9} />{lesson.duration}</span>
                                <ArrowUpRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Resources */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Resources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {resources.map((res, i) => (
                  <motion.a key={i} href={res.url} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all group">
                    <div className="p-1.5 rounded bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400 group-hover:text-primary-500 transition-colors"><res.icon size={14} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{res.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{res.type}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <motion.div key="suggestions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Goals */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Goals</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-100 dark:border-dark-border">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${goal.progress >= goal.total ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                      {goal.progress >= goal.total ? <CheckCircle size={16} /> : <Target size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-900 dark:text-gray-100 truncate">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-bg rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(goal.progress / goal.total) * 100}%` }} transition={{ delay: 0.3 }} className={`h-full rounded-full ${goal.progress >= goal.total ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{goal.progress}/{goal.total}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium">Based on your reviews</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((sug, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setActiveSuggestion(i)} className="flex items-start gap-3 p-3.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-dark-border">
                    <div className={`p-2 rounded-lg h-fit ${sug.bg} ${sug.color} group-hover:scale-110 transition-transform`}><sug.icon size={15} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{sug.title}</h4>
                        {sug.priority === 'high' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">Priority</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sug.reason}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 mt-1 flex-shrink-0 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-500/5 dark:to-violet-500/5 rounded-card border border-primary-100 dark:border-primary-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"><Lightbulb size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Pro Tip</h4>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Review at least 3 pull requests per day to maintain your streak and improve your code quality score. Focus on areas where you have medium-level skills for maximum growth.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Modal */}
      <AnimatePresence>
        {activeLesson && activeLessonData && activePathData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeLesson}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeLessonData.completed ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-primary-50 dark:bg-primary-500/10'}`}>
                    {activeLessonData.completed ? <CheckCircle size={14} className="text-emerald-500" /> : <Play size={14} className="text-primary-600 dark:text-primary-400 ml-0.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{activePathData.title}</p>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeLessonData.title}</h3>
                  </div>
                </div>
                <button onClick={closeLesson} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface transition-all flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {activeLessonData.duration}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    activePathData.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                    activePathData.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  }`}>{activePathData.difficulty}</span>
                  {activeLessonData.completed && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle size={12} /> Completed</span>}
                </div>
                <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4 border border-gray-100 dark:border-dark-border">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{activeLessonData.description}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-dark-border">
                <button onClick={() => toggleLesson(activeLesson.pathId, activeLesson.lessonId)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${activeLessonData.completed ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20'}`}>
                  {activeLessonData.completed ? <><CheckCircle size={14} /> Mark Incomplete</> : <><Check size={14} /> Mark Complete</>}
                </button>
                <button onClick={closeLesson} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 text-[12px] font-medium hover:bg-gray-200 dark:hover:bg-dark-hover transition-all">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion Modal */}
      <AnimatePresence>
        {activeSuggestion !== null && suggestions[activeSuggestion] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSuggestion(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${suggestions[activeSuggestion].bg} ${suggestions[activeSuggestion].color}`}>
                    {(() => { const Icon = suggestions[activeSuggestion].icon; return <Icon size={18} />; })()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{suggestions[activeSuggestion].title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400">{suggestions[activeSuggestion].category}</span>
                      {suggestions[activeSuggestion].priority === 'high' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">Priority</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveSuggestion(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface transition-all">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4 border border-gray-100 dark:border-dark-border">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{suggestions[activeSuggestion].content}</p>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-2">Action Steps</h4>
                  <div className="space-y-1.5">
                    {suggestions[activeSuggestion].steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">{si + 1}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-gray-400">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-2">Resources</h4>
                  <div className="space-y-1.5">
                    {suggestions[activeSuggestion].resources.map((res, ri) => (
                      <div key={ri} className="flex items-center gap-2 text-[12px] text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                        <BookOpen size={11} /> {res}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end p-5 border-t border-gray-100 dark:border-dark-border">
                <button onClick={() => setActiveSuggestion(null)} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-medium transition-all">Got it</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
