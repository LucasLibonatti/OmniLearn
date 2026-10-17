import { supabase } from '../lib/supabase';
import { addDays, lastNDates, spDate, todaySP, weekLabel } from '../lib/dates';
import { tr } from '../i18n';
import type { WeakSpot } from '../types';

function startOfDayISO(ymd: string): string {
  // São Paulo é UTC-3 (sem horário de verão); meia-noite local = 03:00 UTC.
  return new Date(`${ymd}T03:00:00.000Z`).toISOString();
}

export interface DayStat {
  date: string;
  label: string;
  pct: number;
  count: number;
}

export interface SubjectPerf {
  subject_id: string;
  correct: number;
  total: number;
  pct: number;
}

export interface TopicPerf {
  topic: string;
  correct: number;
  total: number;
  pct: number;
}

export async function answeredCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function accuracy(userId: string): Promise<number> {
  const total = await answeredCount(userId);
  if (!total) return 0;
  const { count } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('correct', true);
  return Math.round(((count ?? 0) / total) * 100);
}

export async function answeredToday(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('answered_at', startOfDayISO(todaySP()));
  if (error) throw error;
  return count ?? 0;
}

export async function studiedDates(userId: string, days = 30): Promise<string[]> {
  const from = startOfDayISO(addDays(todaySP(), -(days - 1)));
  const { data, error } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', from);
  if (error) throw error;
  return [...new Set((data ?? []).map((s: { started_at: string }) => spDate(s.started_at)))];
}

export async function weeklyAccuracy(userId: string): Promise<DayStat[]> {
  const days = lastNDates(7);
  const { data, error } = await supabase
    .from('answers')
    .select('correct,answered_at')
    .eq('user_id', userId)
    .gte('answered_at', startOfDayISO(days[0]));
  if (error) throw error;
  const map = new Map<string, { c: number; t: number }>();
  for (const r of (data ?? []) as { correct: boolean; answered_at: string }[]) {
    const d = spDate(r.answered_at);
    const e = map.get(d) ?? { c: 0, t: 0 };
    e.t++;
    if (r.correct) e.c++;
    map.set(d, e);
  }
  return days.map((d) => {
    const e = map.get(d);
    return { date: d, label: weekLabel(d), pct: e && e.t ? Math.round((e.c / e.t) * 100) : 0, count: e?.t ?? 0 };
  });
}

export async function subjectPerformance(userId: string): Promise<SubjectPerf[]> {
  const { data, error } = await supabase.from('answers').select('correct,questions(subject_id)').eq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, { c: number; t: number }>();
  for (const row of (data ?? []) as Array<{ correct: boolean; questions: { subject_id: string } | { subject_id: string }[] | null }>) {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    const sid = q?.subject_id ?? 'none';
    const e = map.get(sid) ?? { c: 0, t: 0 };
    e.t++;
    if (row.correct) e.c++;
    map.set(sid, e);
  }
  return [...map.entries()].map(([subject_id, v]) => ({
    subject_id,
    correct: v.c,
    total: v.t,
    pct: v.t ? Math.round((v.c / v.t) * 100) : 0,
  }));
}

export async function topicPerformance(userId: string, subjectId: string): Promise<TopicPerf[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('correct,questions(topic,subject_id)')
    .eq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, { c: number; t: number }>();
  for (const row of (data ?? []) as Array<{
    correct: boolean;
    questions: { topic: string; subject_id: string } | { topic: string; subject_id: string }[] | null;
  }>) {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    if (q?.subject_id !== subjectId) continue;
    const topic = q?.topic ?? tr('Geral');
    const e = map.get(topic) ?? { c: 0, t: 0 };
    e.t++;
    if (row.correct) e.c++;
    map.set(topic, e);
  }
  return [...map.entries()]
    .map(([topic, v]) => ({ topic, correct: v.c, total: v.t, pct: v.t ? Math.round((v.c / v.t) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct);
}

export function levelOf(acc: number): { level: string; dot: string } {
  if (acc < 0.5) return { level: tr('Precisa revisar'), dot: '🔴' };
  if (acc < 0.7) return { level: tr('Em desenvolvimento'), dot: '🟠' };
  if (acc < 0.85) return { level: tr('Quase lá'), dot: '🟡' };
  return { level: tr('Dominando'), dot: '🟢' };
}

export async function weakSpots(userId: string): Promise<WeakSpot[]> {
  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data, error } = await supabase
    .from('answers')
    .select('correct,questions(topic,subject_id)')
    .eq('user_id', userId)
    .gte('answered_at', from);
  if (error) throw error;
  const map = new Map<string, { c: number; w: number; subject_id: string }>();
  for (const row of (data ?? []) as Array<{
    correct: boolean;
    questions: { topic: string; subject_id: string } | { topic: string; subject_id: string }[] | null;
  }>) {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    const topic = q?.topic ?? tr('Geral');
    const e = map.get(topic) ?? { c: 0, w: 0, subject_id: q?.subject_id ?? '' };
    if (row.correct) e.c++;
    else e.w++;
    map.set(topic, e);
  }
  return [...map.entries()]
    .filter(([, v]) => v.w > 0)
    .map(([topic, v]) => {
      const total = v.c + v.w;
      const acc = total ? v.c / total : 0;
      return { topic, subject_id: v.subject_id, wrong: v.w, of: total, ...levelOf(acc) };
    })
    .sort((a, b) => b.wrong - a.wrong);
}

/** Índice de domínio estimado (0–100) ou null quando há poucas respostas (<10). */
export async function mastery(userId: string): Promise<number | null> {
  const total = await answeredCount(userId);
  if (total < 10) return null;

  const { data: recent } = await supabase
    .from('answers')
    .select('question_id,correct,answered_at')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(100);
  const rows = (recent ?? []) as { question_id: string; correct: boolean }[];
  const ids = rows.map((r) => r.question_id);
  const { data: qs } = ids.length
    ? await supabase.from('questions').select('id,difficulty').in('id', ids)
    : { data: [] as { id: string; difficulty: number | null }[] };
  const diff = new Map((qs ?? []).map((q: { id: string; difficulty: number | null }) => [q.id, q.difficulty ?? 2]));
  let num = 0;
  let den = 0;
  rows.forEach((r, i) => {
    const w = (rows.length - i) * (diff.get(r.question_id) ?? 2);
    den += w;
    if (r.correct) num += w;
  });
  const recAcc = den ? num / den : 0;

  const { data: subs } = await supabase.from('subjects').select('id').eq('user_id', userId).eq('archived', false);
  const subIds = (subs ?? []).map((s: { id: string }) => s.id);
  let coverage = 0;
  if (subIds.length) {
    const { count: tq } = await supabase.from('questions').select('id', { count: 'exact', head: true }).in('subject_id', subIds);
    const { data: distinct } = await supabase.from('answers').select('question_id').eq('user_id', userId);
    const answeredSet = new Set((distinct ?? []).map((d: { question_id: string }) => d.question_id));
    coverage = tq ? Math.min(1, answeredSet.size / tq) : 0;
  }

  const days = lastNDates(14);
  const { data: ansD } = await supabase
    .from('answers')
    .select('answered_at')
    .eq('user_id', userId)
    .gte('answered_at', startOfDayISO(days[0]));
  const studyDays = new Set((ansD ?? []).map((a: { answered_at: string }) => spDate(a.answered_at)));
  const consistency = studyDays.size / 14;

  const { count: progTotal } = await supabase
    .from('question_progress')
    .select('question_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  const { count: progHigh } = await supabase
    .from('question_progress')
    .select('question_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('box', 4);
  const retention = progTotal ? (progHigh ?? 0) / progTotal : 0;

  const m = 0.5 * recAcc + 0.2 * coverage + 0.15 * consistency + 0.15 * retention;
  return Math.max(0, Math.min(100, Math.round(m * 100)));
}
