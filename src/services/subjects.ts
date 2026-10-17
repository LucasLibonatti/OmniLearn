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

const EMPTY_STATS: SubjectStats = { questions: 0, answered: 0, accuracy: 0, progress: 0, last_session: null, streak: 0 };

/** Estatísticas de várias matérias com um número fixo de consultas (evita N+1). */
async function subjectStatsBatch(userId: string, subjectIds: string[]): Promise<Map<string, SubjectStats>> {
  const result = new Map<string, SubjectStats>();
  if (!subjectIds.length) return result;

  const { data: qRows, error: qErr } = await supabase
    .from('questions')
    .select('id,subject_id')
    .in('subject_id', subjectIds);
  if (qErr) throw qErr;
  type QRow = { id: string; subject_id: string };
  const questions = (qRows ?? []) as QRow[];
  const qidsBySubject = new Map<string, string[]>();
  const subjectByQid = new Map<string, string>();
  for (const q of questions) {
    qidsBySubject.set(q.subject_id, [...(qidsBySubject.get(q.subject_id) ?? []), q.id]);
    subjectByQid.set(q.id, q.subject_id);
  }
  const allQids = questions.map((q) => q.id);

  const answersBySubject = new Map<string, { correct: boolean; answered_at: string }[]>();
  if (allQids.length) {
    const { data: aRows, error: aErr } = await supabase
      .from('answers')
      .select('question_id,correct,answered_at')
      .eq('user_id', userId)
      .in('question_id', allQids);
    if (aErr) throw aErr;
    for (const a of (aRows ?? []) as { question_id: string; correct: boolean; answered_at: string }[]) {
      const sid = subjectByQid.get(a.question_id);
      if (!sid) continue;
      answersBySubject.set(sid, [...(answersBySubject.get(sid) ?? []), { correct: a.correct, answered_at: a.answered_at }]);
    }
  }

  const { data: sRows, error: sErr } = await supabase
    .from('sessions')
    .select('subject_id,started_at,finished_at')
    .eq('user_id', userId)
    .in('subject_id', subjectIds)
    .order('started_at', { ascending: false });
  if (sErr) throw sErr;
  const sessionsBySubject = new Map<string, { started_at: string; finished_at: string | null }[]>();
  for (const s of (sRows ?? []) as { subject_id: string; started_at: string; finished_at: string | null }[]) {
    if (!s.subject_id) continue;
    sessionsBySubject.set(s.subject_id, [
      ...(sessionsBySubject.get(s.subject_id) ?? []),
      { started_at: s.started_at, finished_at: s.finished_at },
    ]);
  }

  for (const sid of subjectIds) {
    const qids = qidsBySubject.get(sid) ?? [];
    const all = (answersBySubject.get(sid) ?? []).slice().sort((a, b) => (a.answered_at < b.answered_at ? 1 : -1));
    const recent = all.slice(0, 50);

    let progress = 0;
    let accuracy = 0;
    if (recent.length) {
      const weights = recent.map((_, i) => recent.length - i);
      const wsum = weights.reduce((a, b) => a + b, 0);
      progress = Math.round((recent.reduce((acc, r, i) => acc + (r.correct ? weights[i] : 0), 0) / wsum) * 100);
      accuracy = Math.round((recent.filter((r) => r.correct).length / recent.length) * 100);
    }

    const sessions = (sessionsBySubject.get(sid) ?? []).slice(0, 60);
    const last_session = sessions.length ? sessions[0].started_at : null;
    const streak = streakFromDates(sessions.filter((s) => s.finished_at).map((s) => spDate(s.started_at)));

    result.set(sid, { questions: qids.length, answered: all.length, accuracy, progress, last_session, streak });
  }
  return result;
}

async function subjectStats(userId: string, subjectId: string): Promise<SubjectStats> {
  const map = await subjectStatsBatch(userId, [subjectId]);
  return map.get(subjectId) ?? EMPTY_STATS;
}

async function listByArchived(userId: string, archived: boolean): Promise<SubjectWithStats[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', archived)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const subjects = (data ?? []) as SubjectRow[];
  if (!subjects.length) return [];
  const stats = await subjectStatsBatch(userId, subjects.map((s) => s.id));
  return subjects.map((s) => ({ ...base(s), ...(stats.get(s.id) ?? EMPTY_STATS) }));
}

export function listSubjects(userId: string): Promise<SubjectWithStats[]> {
  return listByArchived(userId, false);
}

/** Matérias arquivadas — ficam fora do fluxo principal, mas o usuário pode reativá-las. */
export function listArchivedSubjects(userId: string): Promise<SubjectWithStats[]> {
  return listByArchived(userId, true);
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

export async function unarchiveSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ archived: false }).eq('id', id);
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
