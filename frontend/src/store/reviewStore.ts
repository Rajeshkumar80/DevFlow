import { create } from 'zustand';
import { CodeReview } from '../types';

interface ReviewState {
  currentReview: CodeReview | null;
  reviews: CodeReview[];
  loading: boolean;
  error: string | null;
  setCurrentReview: (review: CodeReview | null) => void;
  setReviews: (reviews: CodeReview[]) => void;
  addReview: (review: CodeReview) => void;
  updateReview: (review: CodeReview) => void;
  removeReview: (reviewId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  currentReview: null,
  reviews: [],
  loading: false,
  error: null,

  setCurrentReview: (review) => set({ currentReview: review }),

  setReviews: (reviews) => set({ reviews }),

  addReview: (review) => set((state) => ({
    reviews: [review, ...state.reviews]
  })),

  updateReview: (review) => set((state) => ({
    reviews: state.reviews.map((r) => (r.id === review.id ? review : r)),
    currentReview: state.currentReview?.id === review.id ? review : state.currentReview
  })),

  removeReview: (reviewId) => set((state) => ({
    reviews: state.reviews.filter((r) => r.id !== reviewId),
    currentReview: state.currentReview?.id === reviewId ? null : state.currentReview
  })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));