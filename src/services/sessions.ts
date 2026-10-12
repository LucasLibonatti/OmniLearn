import { supabase } from '../lib/supabase';
import type { CompleteResult, SessionMode, SessionRow } from '../types';
import type { SessionDbRow } from '../types/database';

function toSession(r: SessionDbRow): SessionRow {
  return {
    id: r.id,
    user_id: r.user_id,
    subject_id: r.subject_id,
    mode: r.mode as SessionMode,
    topic_filter: r.topic_filter,
    planned_questions: r.planned_questions,
    minutes: r.minutes,
    started_at: r.started_at,
    finished_at: r.finished_at,
    correct: r.correct,
    total: r.total,
    xp_gained: r.xp_gained,
  };
}

export async function startSession(p: {
  subjectId: string;
  mode: SessionMode;
  topicFilter?: string | null;
  planned: number;
}): Promise<string> {
  const { data, error } = await supabase.rpc('start_session', {
    p_subject_id: p.subjectId,
    p_mode: p.mode,
    p_topic_filter: p.topicFilter ?? null,
    p_planned: p.planned,
  });
  if (error) throw error;
  return data as string;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toSession(data as SessionDbRow) : null;
}

export async function pendingSession(userId: string): Promise<SessionRow | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .is('finished_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toSession(data as SessionDbRow) : null;
}

export async function sessionAnsweredIds(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase.from('answers').select('question_id').eq('session_id', sessionId);
  if (error) throw error;
  return ((data ?? []) as { question_id: string }[]).map((a) => a.question_id);
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
  const { data, error } = await supabase.rpc('record_answer', {
    p_session_id: p.sessionId,
    p_question_id: p.questionId,
    p_correct: p.correct,
    p_attempt_text: p.attemptText ?? null,
    p_time_ms: p.timeMs ?? null,
  });
  if (error) throw error;
  const row = (data as RecordResult[])[0];
  return row;
}

export async function completeSession(sessionId: string): Promise<CompleteResult> {
  const { data, error } = await supabase.rpc('complete_session', { p_session_id: sessionId });
  if (error) throw error;
  return (data as CompleteResult[])[0];
}

export interface TopicTally {
  topic: string;
  correct: number;
  wrong: number;
}

export async function sessionTopicBreakdown(sessionId: string): Promise<TopicTally[]> {
  const { data, error } = await supabase.from('answers').select('correct,questions(topic)').eq('session_id', sessionId);
  if (error) throw error;
  const map = new Map<string, TopicTally>();
  for (const row of (data ?? []) as Array<{ correct: boolean; questions: { topic: string } | { topic: string }[] | null }>) {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    const topic = q?.topic ?? 'Geral';
    const t = map.get(topic) ?? { topic, correct: 0, wrong: 0 };
    if (row.correct) t.correct++;
    else t.wrong++;
    map.set(topic, t);
  }
  return [...map.values()];
}
