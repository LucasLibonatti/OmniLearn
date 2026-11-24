import { api } from '../lib/api';

export interface GenerationResult {
  inserted: number;
}

export async function generateQuestions(subjectId: string): Promise<GenerationResult> {
  const data = await api<{ inserted?: number }>('/api/ai/generate-questions', {
    method: 'POST',
    body: { subject_id: subjectId },
  });
  return { inserted: data?.inserted ?? 0 };
}
