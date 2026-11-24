import { api } from '../lib/api';
import type { Question, SessionMode } from '../types';

interface SelectArgs {
  userId?: string;
  subjectId: string;
  mode: SessionMode;
  topicFilter?: string | null;
  planned: number;
  excludeIds?: string[];
}

export async function selectQuestions(a: SelectArgs): Promise<Question[]> {
  return api<Question[]>('/api/sessions/select-questions', {
    method: 'POST',
    body: {
      subjectId: a.subjectId,
      mode: a.mode,
      topicFilter: a.topicFilter ?? null,
      planned: a.planned,
      excludeIds: a.excludeIds ?? [],
    },
  });
}
