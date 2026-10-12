import { supabase } from '../lib/supabase';
import { spDate, streakFromDates } from '../lib/dates';
import type { Subject, SubjectStats, SubjectWithStats } from '../types';
import type { SubjectRow } from '../types/database';

const TONES = [
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];

export function randomTone(): string {
  return TONES[Math.floor(Math.random() * TONES.length)];
}

function base(s: SubjectRow): Subject {
  return { id: s.id, name: s.name, topic: s.topic, tone: s.tone, archived: !!s.archived };
}

async function subjectStats(userId: string, subjectId: string): Promise<SubjectStats> {
  const { count: questions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);

  const { data: qRows } = await supabase.from('questions').select('id').eq('subject_id', subjectId);
  const qids = ((qRows ?? []) as { id: string }[]).map((q) => q.id);

  const { count: answered } = qids.length
    ? await supabase
        .from('answers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('question_id', qids)
    : { count: 0 };

  const { data: recent } = qids.length
    ? await supabase
        .from('answers')
        .select('correct,answered_at')
        .eq('user_id', userId)
        .in('question_id', qids)
        .order('answered_at', { ascending: false })
        .limit(50)
    : { data: [] };
  const rows = (recent ?? []) as { correct: boolean; answered_at: string }[];

  let progress = 0;
  let accuracy = 0;
  if (rows.length) {
    const weights = rows.map((_, i) => rows.length - i);
    const wsum = weights.reduce((a, b) => a + b, 0);
    progress = Math.round((rows.reduce((acc, r, i) => acc + (r.correct ? weights[i] : 0), 0) / wsum) * 100);
    accuracy = Math.round((rows.filter((r) => r.correct).length / rows.length) * 100);
  }

  const { data: sess } = await supabase
    .from('sessions')
    .select('started_at,finished_at')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('started_at', { ascending: false })
    .limit(60);
  const sessions = (sess ?? []) as { started_at: string; finished_at: string | null }[];
  const last_session = sessions.length ? sessions[0].started_at : null;
  const streak = streakFromDates(sessions.filter((s) => s.finished_at).map((s) => spDate(s.started_at)));

  return { questions: questions ?? 0, answered: answered ?? 0, accuracy, progress, last_session, streak };
}

export async function listSubjects(userId: string): Promise<SubjectWithStats[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const subjects = (data ?? []) as SubjectRow[];
  return Promise.all(subjects.map(async (s) => ({ ...base(s), ...(await subjectStats(userId, s.id)) })));
}

export async function getSubject(id: string): Promise<Subject | null> {
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? base(data as SubjectRow) : null;
}

export async function getSubjectStats(userId: string, subjectId: string): Promise<SubjectStats> {
  return subjectStats(userId, subjectId);
}

export async function createSubject(userId: string, name: string, topic: string | null): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ user_id: userId, name, topic, tone: randomTone() })
    .select('*')
    .single();
  if (error) throw error;
  return base(data as SubjectRow);
}

export async function renameSubject(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function archiveSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const { data: mats } = await supabase.from('materials').select('storage_path').eq('subject_id', subjectId);
  const paths = ((mats ?? []) as { storage_path: string }[]).map((m) => m.storage_path).filter(Boolean);
  if (paths.length) await supabase.storage.from('materials').remove(paths);

  const { data: qs } = await supabase.from('questions').select('id').eq('subject_id', subjectId);
  const qids = ((qs ?? []) as { id: string }[]).map((q) => q.id);
  if (qids.length) {
    await supabase.from('answers').delete().in('question_id', qids);
    await supabase.from('question_progress').delete().in('question_id', qids);
    await supabase.from('questions').delete().in('id', qids);
  }
  await supabase.from('materials').delete().eq('subject_id', subjectId);
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
  if (error) throw error;
}
