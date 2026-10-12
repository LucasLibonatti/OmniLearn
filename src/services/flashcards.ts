import { supabase } from '../lib/supabase';
import { toQuestion } from './questions';
import type { Question } from '../types';
import type { QuestionRow } from '../types/database';

export interface Flashcard {
  question: Question;
  box: number;
  next_review_at: string | null;
}

interface ProgressRow {
  box: number;
  next_review_at: string | null;
  questions: QuestionRow | QuestionRow[] | null;
}

/**
 * Fila de revisão espaçada (Leitner). Busca primeiro os cards "vencidos"
 * (next_review_at <= agora). Se não houver nenhum, devolve questões ainda não
 * estudadas para começarem a ser revisadas.
 */
export async function reviewQueue(userId: string, limit = 20, subjectId?: string | null): Promise<Flashcard[]> {
  const now = new Date().toISOString();
  let query = supabase
    .from('question_progress')
    .select('box,next_review_at,questions!inner(id,type,topic,prompt,options,answer,accept,pairs,explanation,difficulty)')
    .eq('user_id', userId)
    .lte('next_review_at', now);
  if (subjectId) query = query.eq('questions.subject_id', subjectId);
  const { data, error } = await query.order('next_review_at', { ascending: true }).limit(limit);
  if (error) throw error;

  const due = ((data ?? []) as ProgressRow[])
    .map((r) => {
      const q = Array.isArray(r.questions) ? r.questions[0] : r.questions;
      return q ? { question: toQuestion(q), box: r.box, next_review_at: r.next_review_at } : null;
    })
    .filter((c): c is Flashcard => !!c);
  if (due.length) return due;

  let freshQuery = supabase
    .from('questions')
    .select('id,type,topic,prompt,options,answer,accept,pairs,explanation,difficulty')
    .eq('user_id', userId);
  if (subjectId) freshQuery = freshQuery.eq('subject_id', subjectId);
  const { data: fresh, error: qErr } = await freshQuery.order('created_at', { ascending: false }).limit(limit);
  if (qErr) throw qErr;
  return ((fresh ?? []) as QuestionRow[]).map((q) => ({ question: toQuestion(q), box: 0, next_review_at: null }));
}

/** Registra o resultado do flashcard (atualiza a caixa da revisão espaçada e dá XP). */
export async function gradeFlashcard(questionId: string, correct: boolean): Promise<{ box: number; xp_gained: number }> {
  const { data, error } = await supabase.rpc('review_flashcard', { p_question_id: questionId, p_correct: correct });
  if (error) throw error;
  return data as { box: number; xp_gained: number };
}
