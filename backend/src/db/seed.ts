import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev'
});

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user1Result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash, full_name, avatar_url, role, is_active, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [uuidv4(), 'john@devflow.ai', 'john_dev', hashedPassword, 'John Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 'admin', true, '{}']
    );
    const user1Id = user1Result.rows[0].id;

    const user2Result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash, full_name, avatar_url, role, is_active, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [uuidv4(), 'sarah@devflow.ai', 'sarah_dev', hashedPassword, 'Sarah Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'lead', true, '{}']
    );
    const user2Id = user2Result.rows[0].id;

    // Create organization
    const orgResult = await pool.query(
      `INSERT INTO organizations (id, name, slug, owner_id, plan, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [uuidv4(), 'DevFlow Team', 'devflow-team', user1Id, 'pro', '{}']
    );
    const orgId = orgResult.rows[0].id;

    // Create team
    const teamResult = await pool.query(
      `INSERT INTO teams (id, org_id, name, slug, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (org_id, slug) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [uuidv4(), orgId, 'Engineering', 'engineering', 'Main engineering team']
    );
    const teamId = teamResult.rows[0].id;

    // Add team members
    await pool.query(
      `INSERT INTO team_members (id, team_id, user_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [uuidv4(), teamId, user1Id, 'admin']
    );
    await pool.query(
      `INSERT INTO team_members (id, team_id, user_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [uuidv4(), teamId, user2Id, 'lead']
    );

    // Create repository
    const repoResult = await pool.query(
      `INSERT INTO repositories (id, org_id, name, github_repo_id, github_url, primary_language, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (org_id, github_repo_id) DO UPDATE SET synced_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [uuidv4(), orgId, 'devflow-api', 12345678, 'https://github.com/devflow/api', 'TypeScript', 'DevFlow API Backend']
    );
    const repoId = repoResult.rows[0].id;

    // Create code reviews
    const review1Id = uuidv4();
    await pool.query(
      `INSERT INTO code_reviews (id, repo_id, title, description, author_id, status, branch_name, base_branch, files_changed, additions, deletions, ai_score, complexity_score, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [review1Id, repoId, 'Fix: Optimize database query in user service', 'This PR optimizes the slow query in the user service by adding proper indexes and rewriting the JOIN', user1Id, 'open', 'feature/optimize-query', 'main', 3, 150, 45, 4.2, 7, 'high']
    );

    const review2Id = uuidv4();
    await pool.query(
      `INSERT INTO code_reviews (id, repo_id, title, description, author_id, status, branch_name, base_branch, files_changed, additions, deletions, ai_score, complexity_score, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [review2Id, repoId, 'Add: New authentication flow with refresh tokens', 'Implements a more secure authentication flow with rotating refresh tokens and better error handling', user2Id, 'approved', 'feature/auth-flow', 'main', 5, 320, 80, 4.8, 5, 'medium']
    );

    // Create comments
    await pool.query(
      `INSERT INTO review_comments (id, review_id, author_id, file_path, line_number, content, is_suggestion, suggestion_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), review1Id, user2Id, 'src/services/userService.ts', 45, 'Consider using a composite index on (user_id, created_at) for better query performance.', true, 'CREATE INDEX idx_user_created ON users(user_id, created_at);']
    );

    await pool.query(
      `INSERT INTO review_comments (id, review_id, author_id, content)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), review1Id, user2Id, 'This optimization looks great! The query time improved from 2s to 50ms in testing.']
    );

    // Create code issues
    await pool.query(
      `INSERT INTO code_issues (id, review_id, issue_type, severity, file_path, line_number, description, suggestion, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [uuidv4(), review1Id, 'performance', 'high', 'src/services/userService.ts', 45, 'N+1 query detected: loop makes multiple database calls', 'Use a single batch query or JOIN to fetch all related data at once', true]
    );

    await pool.query(
      `INSERT INTO code_issues (id, review_id, issue_type, severity, file_path, line_number, description, suggestion, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [uuidv4(), review1Id, 'security', 'critical', 'src/middleware/auth.ts', 23, 'SQL injection vulnerability: user input directly concatenated into query', 'Use parameterized queries instead of string concatenation', true]
    );

    // Create team analytics
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      await pool.query(
        `INSERT INTO team_analytics (id, team_id, date, total_reviews, avg_review_time_hours, total_comments, avg_ai_score, high_risk_files, members_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (team_id, date) DO UPDATE SET total_reviews = EXCLUDED.total_reviews`,
        [uuidv4(), teamId, date.toISOString().split('T')[0], Math.floor(Math.random() * 5) + 1, Math.random() * 24, Math.floor(Math.random() * 20), 3.5 + Math.random() * 1.5, Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 1]
      );
    }

    // Create developer skills
    await pool.query(
      `INSERT INTO developer_skills (id, user_id, skill_name, proficiency_level, experience_points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, skill_name) DO UPDATE SET experience_points = EXCLUDED.experience_points`,
      [uuidv4(), user1Id, 'TypeScript', 'advanced', 850]
    );
    await pool.query(
      `INSERT INTO developer_skills (id, user_id, skill_name, proficiency_level, experience_points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, skill_name) DO UPDATE SET experience_points = EXCLUDED.experience_points`,
      [uuidv4(), user1Id, 'PostgreSQL', 'intermediate', 420]
    );

    console.log('✅ Seed completed successfully');
    console.log('📧 Test login: john@devflow.ai / password123');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();