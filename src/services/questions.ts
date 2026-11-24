import { api } from '../lib/api';
import type { Question } from '../types';

export async function listQuestions(subjectId: string): Promise<Question[]> {
  return api<Question[]>(`/api/subjects/${encodeURIComponent(subjectId)}/questions`);
}

export async function countQuestions(subjectId: string): Promise<number> {
  const list = await listQuestions(subjectId);
  return list.length;
}
