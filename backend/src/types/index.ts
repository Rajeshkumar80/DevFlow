export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  github_id?: string;
  role: 'admin' | 'lead' | 'reviewer' | 'contributor' | 'guest';
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_login?: Date;
  preferences: Record<string, any>;
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

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: Date;
  updated_at: Date;
  settings: Record<string, any>;
  sso_enabled: boolean;
  sso_provider?: string;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'lead' | 'member';
  joined_at: Date;
}

export interface Repository {
  id: string;
  org_id: string;
  name: string;
  github_repo_id?: number;
  github_url?: string;
  primary_language?: string;
  description?: string;
  created_at: Date;
  synced_at?: Date;
}

export interface CodeReview {
  id: string;
  repo_id: string;
  title: string;
  description?: string;
  author_id: string;
  author?: User;
  status: 'draft' | 'open' | 'approved' | 'changes_requested' | 'merged';
  github_pr_id?: number;
  branch_name: string;
  base_branch: string;
  files_changed: number;
  additions: number;
  deletions: number;
  ai_score?: number;
  complexity_score?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  updated_at: Date;
  merged_at?: Date;
  metadata: Record<string, any>;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  author_id: string;
  author?: User;
  file_path?: string;
  line_number?: number;
  content: string;
  is_suggestion: boolean;
  suggestion_text?: string;
  thread_id?: string;
  resolved: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CodeIssue {
  id: string;
  review_id: string;
  issue_type: 'bug' | 'security' | 'performance' | 'style' | 'documentation' | 'test';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file_path?: string;
  line_number?: number;
  description: string;
  suggestion?: string;
  ai_generated: boolean;
  status: 'open' | 'acknowledged' | 'fixed' | 'dismissed';
  created_at: Date;
}

export interface PairSession {
  id: string;
  review_id?: string;
  initiator_id: string;
  status: 'scheduled' | 'active' | 'paused' | 'ended';
  scheduled_at?: Date;
  started_at?: Date;
  ended_at?: Date;
  duration_minutes?: number;
  recording_url?: string;
  participants: string[];
  created_at: Date;
}

export interface TeamAnalytics {
  id: string;
  team_id: string;
  date: Date;
  total_reviews: number;
  avg_review_time_hours: number;
  total_comments: number;
  avg_ai_score: number;
  high_risk_files: number;
  members_active: number;
}

export interface DeveloperSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experience_points: number;
  last_practiced_at?: Date;
  created_at: Date;
}

export interface LearningPath {
  id: string;
  user_id: string;
  skill_category: string;
  lessons_completed: number;
  total_lessons?: number;
  progress_percentage: number;
  recommended_by_ai: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'review_assigned' | 'comment_reply' | 'status_change' | 'learning_recommended' | 'achievement_unlocked';
  title: string;
  content?: string;
  review_id?: string;
  is_read: boolean;
  created_at: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}