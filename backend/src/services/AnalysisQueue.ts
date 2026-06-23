import { Pool } from 'pg';
import { CodeAnalysisService } from './CodeAnalysisService';

export class AnalysisQueue {
  private analysisService: CodeAnalysisService;
  private jobs: Map<string, any> = new Map();

  constructor(private db: any) {
    this.analysisService = new CodeAnalysisService(db);
  }

  async addAnalysisJob(reviewId: string, files: any[]): Promise<string> {
    const jobId = `job-${Date.now()}`;
    this.jobs.set(jobId, { id: jobId, progress: 0, state: 'active', filesAnalyzed: 0, totalFiles: files.length, reviewId });

    for (let i = 0; i < files.length; i++) {
      await this.analysisService.analyzeCode(files[i].content, files[i].language, files[i].path, reviewId);
      this.jobs.set(jobId, { ...this.jobs.get(jobId), progress: Math.round(((i + 1) / files.length) * 100), filesAnalyzed: i + 1 });
    }

    this.jobs.set(jobId, { ...this.jobs.get(jobId), state: 'completed' });
    return jobId;
  }

  async getJobProgress(jobId: string): Promise<any> {
    return this.jobs.get(jobId) || null;
  }
}