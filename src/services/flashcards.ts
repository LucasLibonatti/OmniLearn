import { api } from '../lib/api';
import type { Question } from '../types';

export interface Flashcard {
  question: Question;
  box: number;
  next_review_at: string | null;
}

export async function reviewQueue(limit = 20, subjectId?: string | null): Promise<Flashcard[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (subjectId) params.set('subjectId', subjectId);
  return api<Flashcard[]>(`/api/study/flashcards?${params.toString()}`);
}

export async function gradeFlashcard(questionId: string, correct: boolean): Promise<{ box: number; xp_gained: number }> {
  return api<{ box: number; xp_gained: number }>(`/api/study/flashcards/${encodeURIComponent(questionId)}/grade`, {
    method: 'POST',
    body: { correct },
  });
}
