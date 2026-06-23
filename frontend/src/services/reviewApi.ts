import api from './api';
import { CodeReview, ReviewComment } from '../types';

export const reviewApi = {
  createReview: async (repoId: string, data: {
    title: string;
    description: string;
    branchName: string;
    baseBranch?: string;
  }): Promise<CodeReview> => {
    const response = await api.post(`/reviews/${repoId}`, data);
    return response.data;
  },

  getReview: async (repoId: string, reviewId: string): Promise<CodeReview> => {
    const response = await api.get(`/reviews/${repoId}/${reviewId}`);
    return response.data;
  },

  listReviews: async (repoId: string, status?: string): Promise<CodeReview[]> => {
    const params = status ? { status } : {};
    const response = await api.get(`/reviews/${repoId}`, { params });
    return response.data;
  },

  updateReviewStatus: async (repoId: string, reviewId: string, status: string): Promise<CodeReview> => {
    const response = await api.patch(`/reviews/${repoId}/${reviewId}/status`, { status });
    return response.data;
  },

  deleteReview: async (repoId: string, reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${repoId}/${reviewId}`);
  },

  addComment: async (reviewId: string, data: {
    filePath?: string;
    lineNumber?: number;
    content: string;
    isSuggestion?: boolean;
    suggestionText?: string;
  }): Promise<ReviewComment> => {
    const response = await api.post(`/${reviewId}/comments`, data);
    return response.data;
  },

  getComments: async (reviewId: string): Promise<ReviewComment[]> => {
    const response = await api.get(`/${reviewId}/comments`);
    return response.data;
  },

  resolveComment: async (reviewId: string, commentId: string): Promise<ReviewComment> => {
    const response = await api.patch(`/${reviewId}/comments/${commentId}/resolve`);
    return response.data;
  },

  deleteComment: async (reviewId: string, commentId: string): Promise<void> => {
    await api.delete(`/${reviewId}/comments/${commentId}`);
  }
};