import { supabase } from '../lib/supabase';
import type { Question, QType } from '../types';
import type { QuestionRow } from '../types/database';

export function toQuestion(r: QuestionRow): Question {
  return {
    id: r.id,
    type: r.type as QType,
    topic: r.topic,
    prompt: r.prompt,
    options: (r.options as string[] | null) ?? undefined,
    answer: r.answer ?? '',
    accept: (r.accept as string[] | null) ?? undefined,
    pairs: (r.pairs as [string, string][] | null) ?? undefined,
    explanation: r.explanation ?? '',
    difficulty: r.difficulty ?? undefined,
    material_id: r.material_id,
  };
}

export async function listQuestions(subjectId: string): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*').eq('subject_id', subjectId);
  if (error) throw error;
  return ((data ?? []) as QuestionRow[]).map(toQuestion);
}

export async function countQuestions(subjectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);
  if (error) throw error;
  return count ?? 0;
}
