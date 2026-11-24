import { api } from '../lib/api';
import type { CompleteResult, SessionMode, SessionRow } from '../types';

export async function startSession(p: {
  subjectId: string;
  mode: SessionMode;
  topicFilter?: string | null;
  planned: number;
}): Promise<string> {
  const res = await api<{ id: string }>('/api/sessions', { method: 'POST', body: p });
  return res.id;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  return api<SessionRow | null>(`/api/sessions/${encodeURIComponent(id)}`);
}

export async function pendingSession(): Promise<SessionRow | null> {
  return api<SessionRow | null>('/api/sessions/pending');
}

export async function sessionAnsweredIds(sessionId: string): Promise<string[]> {
  return api<string[]>(`/api/sessions/${encodeURIComponent(sessionId)}/answered`);
}

export interface RecordResult {
  xp_gained: number;
  streak_bonus: boolean;
  session_correct: number;
  session_total: number;
  session_xp: number;
}

export async function recordAnswer(p: {
  sessionId: string;
  questionId: string;
  correct: boolean;
  attemptText?: string | null;
  timeMs?: number | null;
}): Promise<RecordResult> {
  return api<RecordResult>(`/api/sessions/${encodeURIComponent(p.sessionId)}/answers`, {
    method: 'POST',
    body: {
      questionId: p.questionId,
      correct: p.correct,
      attemptText: p.attemptText ?? null,
      timeMs: p.timeMs ?? null,
    },
  });
}

export async function completeSession(sessionId: string): Promise<CompleteResult> {
  return api<CompleteResult>(`/api/sessions/${encodeURIComponent(sessionId)}/complete`, { method: 'POST' });
}

export interface TopicTally {
  topic: string;
  correct: number;
  wrong: number;
}

export async function sessionTopicBreakdown(sessionId: string): Promise<TopicTally[]> {
  return api<TopicTally[]>(`/api/sessions/${encodeURIComponent(sessionId)}/topics`);
}
