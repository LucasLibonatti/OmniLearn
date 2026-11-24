import { Hono } from 'hono';
import type { AppEnv } from '../auth.js';
import { query, queryOne } from '../db.js';

interface QuestionRow {
  id: string;
  type: 'multiple' | 'tf' | 'fill' | 'match' | 'short';
  topic: string;
  prompt: string;
  options: string[] | null;
  answer: string | null;
  accept: string[] | null;
  pairs: [string, string][] | null;
  explanation: string | null;
  difficulty: number | null;
  material_id: string | null;
}

function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function interleave(qs: QuestionRow[]): QuestionRow[] {
  const bins = new Map<string, QuestionRow[]>();
  for (const q of qs) {
    const b = bins.get(q.type) ?? [];
    b.push(q);
    bins.set(q.type, b);
  }
  const out: QuestionRow[] = [];
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

export const sessionsRoutes = new Hono<AppEnv>();

sessionsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as {
    subjectId?: string;
    mode?: 'smart' | 'review' | 'topic';
    topicFilter?: string | null;
    planned?: number;
  };
  if (!body.subjectId) return c.json({ error: 'Informe a matéria.' }, 400);
  const mode = body.mode && ['smart', 'review', 'topic'].includes(body.mode) ? body.mode : 'smart';
  const planned = Math.max(1, Math.min(50, Math.round(Number(body.planned) || 18)));
  try {
    const row = await queryOne<{ id: string }>(
      `select public.start_session($1, $2::uuid, $3, $4, $5) as id`,
      [user.id, body.subjectId, mode, body.topicFilter ?? null, planned],
    );
    return c.json({ id: row?.id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

sessionsRoutes.get('/pending', async (c) => {
  const user = c.get('user');
  const row = await queryOne(
    `select id, user_id, subject_id, mode, topic_filter, planned_questions, minutes,
            started_at, finished_at, correct, total, xp_gained
     from public.sessions
     where user_id = $1 and finished_at is null
     order by started_at desc
     limit 1`,
    [user.id],
  );
  return c.json(row);
});

sessionsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const row = await queryOne(
    `select id, user_id, subject_id, mode, topic_filter, planned_questions, minutes,
            started_at, finished_at, correct, total, xp_gained
     from public.sessions
     where id = $1::uuid and user_id = $2`,
    [id, user.id],
  );
  if (!row) return c.json(null);
  return c.json(row);
});

sessionsRoutes.get('/:id/answered', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rows = await query<{ question_id: string }>(
    `select question_id from public.answers where session_id = $1::uuid and user_id = $2`,
    [id, user.id],
  );
  return c.json(rows.map((r) => r.question_id));
});

sessionsRoutes.get('/:id/topics', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rows = await query<{ topic: string; correct: string; wrong: string }>(
    `select coalesce(q.topic, 'Geral') as topic,
            sum(case when a.correct then 1 else 0 end)::text as correct,
            sum(case when a.correct then 0 else 1 end)::text as wrong
     from public.answers a
     left join public.questions q on q.id = a.question_id
     where a.session_id = $1::uuid and a.user_id = $2
     group by coalesce(q.topic, 'Geral')`,
    [id, user.id],
  );
  return c.json(
    rows.map((r) => ({
      topic: r.topic,
      correct: Number(r.correct),
      wrong: Number(r.wrong),
    })),
  );
});

sessionsRoutes.post('/select-questions', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as {
    subjectId?: string;
    mode?: 'smart' | 'review' | 'topic';
    topicFilter?: string | null;
    planned?: number;
    excludeIds?: string[];
  };
  if (!body.subjectId) return c.json([]);

  const allQs = await query<QuestionRow>(
    `select id, type, topic, prompt, options, answer, accept, pairs, explanation, difficulty, material_id
     from public.questions
     where subject_id = $1::uuid and user_id = $2`,
    [body.subjectId, user.id],
  );
  if (!allQs.length) return c.json([]);

  const exclude = new Set(body.excludeIds ?? []);
  const qs = allQs.filter((q) => !exclude.has(q.id));
  if (!qs.length) return c.json([]);

  const qIds = qs.map((q) => q.id);
  const [recent, prog] = await Promise.all([
    query<{ question_id: string; correct: boolean; answered_at: string }>(
      `select question_id, correct, answered_at
       from public.answers
       where user_id = $1
       order by answered_at desc
       limit 300`,
      [user.id],
    ),
    query<{ question_id: string; next_review_at: string | null }>(
      `select question_id, next_review_at
       from public.question_progress
       where user_id = $1 and question_id = any($2::uuid[])`,
      [user.id, qIds],
    ),
  ]);

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
  const due = new Set(
    prog
      .filter((p) => p.next_review_at && new Date(p.next_review_at).getTime() <= Date.now())
      .map((p) => p.question_id),
  );

  const n = Math.max(1, Math.min(50, Math.round(Number(body.planned) || 18)));
  const take = (arr: QuestionRow[], count: number) => shuffle(arr).slice(0, Math.max(0, count));

  let chosen: QuestionRow[] = [];
  if (body.mode === 'topic' && body.topicFilter) {
    const pool = qs.filter((q) => q.topic === body.topicFilter);
    chosen = take(pool.filter((q) => !last24.has(q.id)), n);
    if (chosen.length < n) {
      const used = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(take(pool.filter((q) => !used.has(q.id)), n - chosen.length));
    }
  } else if (body.mode === 'review') {
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

  return c.json(interleave(chosen.slice(0, n)));
});

sessionsRoutes.post('/:id/answers', async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    questionId?: string;
    correct?: boolean;
    attemptText?: string | null;
    timeMs?: number | null;
  };
  if (!body.questionId || typeof body.correct !== 'boolean') {
    return c.json({ error: 'Dados da resposta incompletos.' }, 400);
  }
  const row = await queryOne(
    `select * from public.record_answer($1, $2::uuid, $3::uuid, $4, $5, $6)`,
    [user.id, sessionId, body.questionId, body.correct, body.attemptText ?? null, body.timeMs ?? null],
  );
  return c.json(row);
});

sessionsRoutes.post('/:id/complete', async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('id');
  const row = await queryOne(
    `select * from public.complete_session($1, $2::uuid)`,
    [user.id, sessionId],
  );
  return c.json(row);
});
