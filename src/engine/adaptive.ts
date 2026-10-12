import { supabase } from '../lib/supabase';
import { listQuestions } from '../services/questions';
import type { Question, SessionMode } from '../types';

interface SelectArgs {
  userId: string;
  subjectId: string;
  mode: SessionMode;
  topicFilter?: string | null;
  planned: number;
  excludeIds?: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Evita 3 questões seguidas do mesmo tipo. */
function interleave(qs: Question[]): Question[] {
  const bins = new Map<string, Question[]>();
  for (const q of qs) {
    const b = bins.get(q.type) ?? [];
    b.push(q);
    bins.set(q.type, b);
  }
  const out: Question[] = [];
  let last = '';
  let last2 = '';
  while (out.length < qs.length) {
    const types = [...bins.keys()].filter((t) => (bins.get(t)?.length ?? 0) > 0);
    if (!types.length) break;
    const pick = types.find((t) => !(t === last && t === last2)) ?? types[0];
    out.push(bins.get(pick)!.shift()!);
    last2 = last;
    last = pick;
  }
  return out;
}

export async function selectQuestions(a: SelectArgs): Promise<Question[]> {
  let qs = await listQuestions(a.subjectId);
  if (!qs.length) return [];

  const exclude = new Set(a.excludeIds ?? []);
  qs = qs.filter((q) => !exclude.has(q.id));
  if (!qs.length) return [];

  const { data: rec } = await supabase
    .from('answers')
    .select('question_id,correct,answered_at')
    .eq('user_id', a.userId)
    .order('answered_at', { ascending: false })
    .limit(300);
  const recent = (rec ?? []) as { question_id: string; correct: boolean; answered_at: string }[];

  const topicOf = new Map(qs.map((q) => [q.id, q.topic]));
  const agg = new Map<string, { c: number; t: number }>();
  const erroredTopics = new Set<string>();
  const since = Date.now() - 30 * 86400000;
  for (const r of recent) {
    const t = topicOf.get(r.question_id);
    if (!t) continue;
    const e = agg.get(t) ?? { c: 0, t: 0 };
    e.t++;
    if (r.correct) e.c++;
    agg.set(t, e);
    if (!r.correct && new Date(r.answered_at).getTime() >= since) erroredTopics.add(t);
  }
  const weakTopics = new Set([...agg.entries()].filter(([, v]) => v.t > 0 && v.c / v.t < 0.7).map(([k]) => k));

  const last24 = new Set(
    recent.filter((r) => r.correct && Date.now() - new Date(r.answered_at).getTime() < 86400000).map((r) => r.question_id),
  );

  const ids = qs.map((q) => q.id);
  const { data: prog } = await supabase
    .from('question_progress')
    .select('question_id,next_review_at')
    .eq('user_id', a.userId)
    .in('question_id', ids);
  const due = new Set(
    ((prog ?? []) as { question_id: string; next_review_at: string | null }[])
      .filter((p) => p.next_review_at && new Date(p.next_review_at).getTime() <= Date.now())
      .map((p) => p.question_id),
  );

  const n = a.planned;
  const take = (arr: Question[], count: number) => shuffle(arr).slice(0, Math.max(0, count));

  let chosen: Question[] = [];

  if (a.mode === 'topic' && a.topicFilter) {
    const pool = qs.filter((q) => q.topic === a.topicFilter);
    chosen = take(pool.filter((q) => !last24.has(q.id)), n);
    if (chosen.length < n) {
      const used = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(take(pool.filter((q) => !used.has(q.id)), n - chosen.length));
    }
  } else if (a.mode === 'review') {
    const pool = qs.filter((q) => erroredTopics.has(q.topic));
    const base = pool.length ? pool : qs;
    chosen = take(base.filter((q) => !last24.has(q.id)), n);
    if (chosen.length < n) {
      const used = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(take(base.filter((q) => !used.has(q.id)), n - chosen.length));
    }
  } else {
    const available = qs.filter((q) => !last24.has(q.id));
    const weak = available.filter((q) => weakTopics.has(q.topic));
    const dueQ = available.filter((q) => !weakTopics.has(q.topic) && due.has(q.id));
    const rest = available.filter((q) => !weakTopics.has(q.topic) && !due.has(q.id));
    chosen = [
      ...take(weak, Math.ceil(n * 0.5)),
      ...take(dueQ, Math.ceil(n * 0.3)),
      ...take(rest, Math.ceil(n * 0.2)),
    ];
    if (chosen.length < n) {
      const used = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(take(available.filter((q) => !used.has(q.id)), n - chosen.length));
    }
    if (chosen.length < n) {
      const used = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(take(qs.filter((q) => !used.has(q.id)), n - chosen.length));
    }
  }

  return interleave(chosen.slice(0, n));
}
