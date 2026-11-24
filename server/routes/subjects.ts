import { Hono } from 'hono';
import type { AppEnv } from '../auth.js';
import { query, queryOne, spDate, streakFromDates } from '../db.js';

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

interface SubjectRow {
  id: string;
  name: string;
  topic: string | null;
  tone: string | null;
  archived: boolean;
}

interface SubjectStats {
  questions: number;
  answered: number;
  accuracy: number;
  progress: number;
  last_session: string | null;
  streak: number;
}

const EMPTY_STATS: SubjectStats = {
  questions: 0,
  answered: 0,
  accuracy: 0,
  progress: 0,
  last_session: null,
  streak: 0,
};

async function subjectStatsBatch(userId: string, subjectIds: string[]): Promise<Map<string, SubjectStats>> {
  const result = new Map<string, SubjectStats>();
  if (!subjectIds.length) return result;

  const [qRows, aRows, sRows] = await Promise.all([
    query<{ id: string; subject_id: string }>(
      `select id, subject_id from public.questions where user_id = $1 and subject_id = any($2::uuid[])`,
      [userId, subjectIds],
    ),
    query<{ subject_id: string; correct: boolean; answered_at: string }>(
      `select q.subject_id, a.correct, a.answered_at
       from public.answers a
       join public.questions q on q.id = a.question_id
       where a.user_id = $1 and q.subject_id = any($2::uuid[])
       order by a.answered_at desc`,
      [userId, subjectIds],
    ),
    query<{ subject_id: string; started_at: string; finished_at: string | null }>(
      `select subject_id, started_at, finished_at
       from public.sessions
       where user_id = $1 and subject_id = any($2::uuid[])
       order by started_at desc`,
      [userId, subjectIds],
    ),
  ]);

  const qCount = new Map<string, number>();
  for (const q of qRows) qCount.set(q.subject_id, (qCount.get(q.subject_id) ?? 0) + 1);

  const answersBySubject = new Map<string, { correct: boolean; answered_at: string }[]>();
  for (const a of aRows) {
    let list = answersBySubject.get(a.subject_id);
    if (!list) {
      list = [];
      answersBySubject.set(a.subject_id, list);
    }
    list.push({ correct: a.correct, answered_at: a.answered_at });
  }

  const sessionsBySubject = new Map<string, { started_at: string; finished_at: string | null }[]>();
  for (const s of sRows) {
    let list = sessionsBySubject.get(s.subject_id);
    if (!list) {
      list = [];
      sessionsBySubject.set(s.subject_id, list);
    }
    list.push({ started_at: s.started_at, finished_at: s.finished_at });
  }

  for (const sid of subjectIds) {
    const all = answersBySubject.get(sid) ?? [];
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
    const last_session = sessions.length ? new Date(sessions[0].started_at).toISOString() : null;
    const streak = streakFromDates(sessions.filter((s) => s.finished_at).map((s) => spDate(s.started_at)));

    result.set(sid, {
      questions: qCount.get(sid) ?? 0,
      answered: all.length,
      accuracy,
      progress,
      last_session,
      streak,
    });
  }
  return result;
}

export const subjectsRoutes = new Hono<AppEnv>();

subjectsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const archived = c.req.query('archived') === 'true';
  const rows = await query<SubjectRow>(
    `select id, name, topic, tone, archived
     from public.subjects
     where user_id = $1 and archived = $2
     order by created_at desc`,
    [user.id, archived],
  );
  if (!rows.length) return c.json([]);
  const stats = await subjectStatsBatch(
    user.id,
    rows.map((r) => r.id),
  );
  return c.json(rows.map((r) => ({ ...r, ...(stats.get(r.id) ?? EMPTY_STATS) })));
});

subjectsRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; topic?: string | null };
  const name = (body.name ?? '').trim().slice(0, 120);
  if (!name) return c.json({ error: 'Dê um nome para a matéria.' }, 400);
  const topic = body.topic?.trim().slice(0, 160) || null;
  const tone = TONES[Math.floor(Math.random() * TONES.length)];
  const row = await queryOne<SubjectRow>(
    `insert into public.subjects (user_id, name, topic, tone)
     values ($1, $2, $3, $4)
     returning id, name, topic, tone, archived`,
    [user.id, name, topic, tone],
  );
  return c.json(row, 201);
});

subjectsRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const subject = await queryOne<SubjectRow>(
    `select id, name, topic, tone, archived from public.subjects where id = $1 and user_id = $2`,
    [id, user.id],
  );
  if (!subject) return c.json({ error: 'Matéria não encontrada.' }, 404);

  const [statsMap, materials, topicRows] = await Promise.all([
    subjectStatsBatch(user.id, [id]),
    query<{
      id: string;
      user_id: string;
      subject_id: string;
      file_name: string;
      storage_path: string;
      pages: number;
      status: string;
      error_message: string | null;
      created_at: string;
    }>(
      `select id, user_id, subject_id, file_name, storage_path, pages, status, error_message, created_at
       from public.materials
       where subject_id = $1 and user_id = $2
       order by created_at asc`,
      [id, user.id],
    ),
    query<{ topic: string; correct: string; total: string }>(
      `select q.topic,
              sum(case when a.correct then 1 else 0 end)::text as correct,
              count(*)::text as total
       from public.answers a
       join public.questions q on q.id = a.question_id
       where a.user_id = $1 and q.subject_id = $2
       group by q.topic`,
      [user.id, id],
    ),
  ]);

  const stats = statsMap.get(id) ?? EMPTY_STATS;
  const topics = topicRows
    .map((r) => {
      const correct = Number(r.correct);
      const total = Number(r.total);
      return { topic: r.topic || 'Geral', correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
    })
    .sort((a, b) => a.pct - b.pct);

  return c.json({ subject, questions: stats.questions, materials, stats, topics });
});

subjectsRoutes.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; archived?: boolean };
  const updates: string[] = [];
  const params: unknown[] = [];

  if (typeof body.name === 'string') {
    const clean = body.name.trim().slice(0, 120);
    if (!clean) return c.json({ error: 'Nome inválido.' }, 400);
    params.push(clean);
    updates.push(`name = $${params.length}`);
  }
  if (typeof body.archived === 'boolean') {
    params.push(body.archived);
    updates.push(`archived = $${params.length}`);
  }
  if (!updates.length) return c.json({ error: 'Nenhuma alteração enviada.' }, 400);

  params.push(id, user.id);
  const row = await queryOne<SubjectRow>(
    `update public.subjects set ${updates.join(', ')}
     where id = $${params.length - 1} and user_id = $${params.length}
     returning id, name, topic, tone, archived`,
    params,
  );
  if (!row) return c.json({ error: 'Matéria não encontrada.' }, 404);
  return c.json(row);
});

subjectsRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const row = await queryOne<{ id: string }>(
    `delete from public.subjects where id = $1 and user_id = $2 returning id`,
    [id, user.id],
  );
  if (!row) return c.json({ error: 'Matéria não encontrada.' }, 404);
  return c.json({ ok: true });
});

subjectsRoutes.get('/:id/materials', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rows = await query(
    `select id, user_id, subject_id, file_name, storage_path, pages, status, error_message, created_at
     from public.materials
     where subject_id = $1 and user_id = $2
     order by created_at asc`,
    [id, user.id],
  );
  return c.json(rows);
});

subjectsRoutes.post('/:id/materials', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const subject = await queryOne<{ id: string }>(
    `select id from public.subjects where id = $1 and user_id = $2`,
    [id, user.id],
  );
  if (!subject) return c.json({ error: 'Matéria não encontrada.' }, 404);

  const countRow = await queryOne<{ c: string }>(
    `select count(*)::text as c from public.materials where subject_id = $1 and user_id = $2`,
    [id, user.id],
  );
  if (Number(countRow?.c ?? 0) >= 1) {
    return c.json({ error: 'Cada matéria aceita apenas 1 arquivo por vez. Remova o material anterior primeiro.' }, 400);
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    file_name?: string;
    pages?: number;
    extracted_text?: string;
  };
  const text = (body.extracted_text ?? '').trim();
  if (text.length < 200) {
    return c.json({ error: 'O conteúdo precisa ter pelo menos 200 caracteres.' }, 400);
  }
  const fileName = (body.file_name ?? 'Material').trim().slice(0, 160) || 'Material';
  const pages = Math.max(1, Math.min(200, Math.round(Number(body.pages) || 1)));

  const row = await queryOne(
    `insert into public.materials (user_id, subject_id, file_name, storage_path, pages, status, extracted_text, char_count)
     values ($1, $2, $3, '', $4, 'extracted', $5, $6)
     returning id, user_id, subject_id, file_name, storage_path, pages, status, error_message, created_at`,
    [user.id, id, fileName, pages, text, text.length],
  );
  return c.json(row, 201);
});

subjectsRoutes.get('/:id/questions', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rows = await query(
    `select id, type, topic, prompt, options, answer, accept, pairs, explanation, difficulty, material_id
     from public.questions
     where subject_id = $1 and user_id = $2
     order by created_at asc`,
    [id, user.id],
  );
  return c.json(rows);
});
