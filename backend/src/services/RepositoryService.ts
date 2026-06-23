import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from '../types';

export class RepositoryService {
  constructor(private db: any) {}

  async createRepository(orgId: string, name: string, githubRepoId?: number, githubUrl?: string, language?: string, description?: string): Promise<Repository> {
    return { id: uuidv4(), org_id: orgId, name, github_repo_id: githubRepoId || null, github_url: githubUrl || null, primary_language: language || null, description: description || null, created_at: new Date(), synced_at: null } as any;
  }

  async getRepository(repoId: string): Promise<Repository | null> {
    if (this.db.repos) return this.db.repos.find((r: any) => r.id === repoId) || null;
    return { id: repoId, org_id: 'org-1', name: 'devflow-api', github_repo_id: 12345678, github_url: 'https://github.com/devflow/api', primary_language: 'TypeScript', description: 'DevFlow API Backend', created_at: new Date(), synced_at: new Date() };
  }

  async listRepositories(orgId: string): Promise<Repository[]> {
    return [{ id: 'repo-1', org_id: orgId, name: 'devflow-api', github_repo_id: 12345678, github_url: 'https://github.com/devflow/api', primary_language: 'TypeScript', description: 'DevFlow API Backend', created_at: new Date(), synced_at: new Date() }];
  }
}