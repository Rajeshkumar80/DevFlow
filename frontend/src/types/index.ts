export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'lead' | 'reviewer' | 'contributor' | 'guest';
  created_at: Date;
  is_active: boolean;
  preferences?: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
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
}

export interface CodeReview {
  id: string;
  repo_id: string;
  title: string;
  description?: string;
  author_id: string;
  author_username?: string;
  author_avatar?: string;
  status: 'draft' | 'open' | 'approved' | 'changes_requested' | 'merged';
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
  code_files?: { name: string; content: string }[];
}

export interface ReviewComment {
  id: string;
  review_id: string;
  author_id: string;
  author_username?: string;
  author_avatar?: string;
  file_path?: string;
  line_number?: number;
  content: string;
  is_suggestion: boolean;
  suggestion_text?: string;
  thread_id?: string;
  resolved: boolean;
  created_at: Date;
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
  name?: string;
  review_id?: string;
  creator_id: string;
  initiator_id?: string;
  status: 'scheduled' | 'active' | 'paused' | 'ended';
  code?: string;
  participants: string[];
  started_at?: Date;
  ended_at?: Date;
  duration_minutes?: number;
  created_at?: Date;
  updated_at?: Date;
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

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}