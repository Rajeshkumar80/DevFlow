import api from './api';
import { CodeIssue } from '../types';

export const analysisApi = {
  analyzeCode: async (reviewId: string, data: {
    code: string;
    language: string;
    filePath?: string;
  }): Promise<any> => {
    const response = await api.post(`/${reviewId}/analyze`, data);
    return response.data;
  },

  batchAnalyze: async (reviewId: string, files: any[]): Promise<{ jobId: string }> => {
    const response = await api.post(`/${reviewId}/batch-analyze`, { files });
    return response.data;
  },

  getAnalysisProgress: async (reviewId: string, jobId: string): Promise<any> => {
    const response = await api.get(`/${reviewId}/batch-analyze/${jobId}`);
    return response.data;
  },

  getSuggestions: async (reviewId: string, data: {
    code: string;
    language: string;
    issueType: string;
  }): Promise<any> => {
    const response = await api.post(`/${reviewId}/suggestions`, data);
    return response.data;
  },

  getIssues: async (reviewId: string): Promise<{ issues: CodeIssue[]; bySeverity: Record<string, number> }> => {
    const response = await api.get(`/${reviewId}/issues`);
    return response.data;
  },

  updateIssueStatus: async (reviewId: string, issueId: string, status: string): Promise<CodeIssue> => {
    const response = await api.patch(`/${reviewId}/issues/${issueId}`, { status });
    return response.data;
  }
};