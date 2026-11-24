import { Hono } from 'hono';
import type { AppEnv } from '../auth.js';
import { addDays, lastNDates, query, queryOne, spDate, startOfDayISO, todaySP } from '../db.js';

export const studyRoutes = new Hono<AppEnv>();

// ===== Flashcards (Leitner) =====
studyRoutes.get('/flashcards', async (c) => {
  const user = c.get('user');
  const subjectId = c.req.query('subjectId') || null;
  const limit = Math.max(1, Math.min(50, Number(c.req.query('limit') || 20)));

  const dueRows = await query<{
    box: number;
    next_review_at: string | null;
    id: string;
    type: string;
    topic: string;
    prompt: string;
    options: unknown;
    answer: string | null;
    accept: unknown;
    pairs: unknown;
    explanation: string | null;
    difficulty: number | null;
    material_id: string | null;
  }>(
    `select qp.box, qp.next_review_at,
            q.id, q.type, q.topic, q.prompt, q.options, q.answer, q.accept, q.pairs, q.explanation, q.difficulty, q.material_id
     from public.question_progress qp
     join public.questions q on q.id = qp.question_id
     where qp.user_id = $1
       and qp.next_review_at <= now()
       and ($2::uuid is null or q.subject_id = $2::uuid)
     order by qp.next_review_at asc
     limit $3`,
    [user.id, subjectId, limit],
  );

  if (dueRows.length) {
    return c.json(
      dueRows.map((r) => ({
        box: r.box,
        next_review_at: r.next_review_at,
        question: {
          id: r.id,
          type: r.type,
          topic: r.topic,
          prompt: r.prompt,
          options: r.options ?? undefined,
          answer: r.answer ?? '',
          accept: r.accept ?? undefined,
          pairs: r.pairs ?? undefined,
          explanation: r.explanation ?? '',
          difficulty: r.difficulty ?? undefined,
          material_id: r.material_id,
        },
      })),
    );
  }

  const freshRows = await query<{
    id: string;
    type: string;
    topic: string;
    prompt: string;
    options: unknown;
    answer: string | null;
    accept: unknown;
    pairs: unknown;
    explanation: string | null;
    difficulty: number | null;
    material_id: string | null;
  }>(
    `select id, type, topic, prompt, options, answer, accept, pairs, explanation, difficulty, material_id
     from public.questions
     where user_id = $1
       and ($2::uuid is null or subject_id = $2::uuid)
     order by created_at desc
     limit $3`,
    [user.id, subjectId, limit],
  );

  return c.json(
    freshRows.map((q) => ({
      box: 0,
      next_review_at: null,
      question: {
        id: q.id,
        type: q.type,
        topic: q.topic,
        prompt: q.prompt,
        options: q.options ?? undefined,
        answer: q.answer ?? '',
        accept: q.accept ?? undefined,
        pairs: q.pairs ?? undefined,
        explanation: q.explanation ?? '',
        difficulty: q.difficulty ?? undefined,
        material_id: q.material_id,
      },
    })),
  );
});

studyRoutes.post('/flashcards/:questionId/grade', async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('questionId');
  const body = (await c.req.json().catch(() => ({}))) as { correct?: boolean };
  if (typeof body.correct !== 'boolean') return c.json({ error: 'Informe o resultado.' }, 400);
  const row = await queryOne<{ box: number; xp_gained: number }>(
    `select * from public.review_flashcard($1, $2::uuid, $3)`,
    [user.id, questionId, body.correct],
  );
  return c.json(row);
});

// ===== Achievements =====
studyRoutes.get('/achievements', async (c) => {
  const user = c.get('user');
  const since = c.req.query('since');
  const [cat, mine] = await Promise.all([
    query<{ id: string; icon: string; title: string; descr: string }>(`select id, icon, title, descr from public.achievements`),
    query<{ achievement_id: string; unlocked_at: string }>(
      `select achievement_id, unlocked_at from public.user_achievements where user_id = $1`,
      [user.id],
    ),
  ]);
  const unlockedMap = new Map(mine.map((m) => [m.achievement_id, new Date(m.unlocked_at).toISOString()]));
  const order = ['first_session', 'perfect_week', 'hundred_questions', 'subject_master', 'consistent_30'];
  let list = cat
    .map((a) => ({ ...a, unlocked: unlockedMap.has(a.id), unlocked_at: unlockedMap.get(a.id) ?? null }))
    .sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  if (since) {
    list = list.filter((a) => a.unlocked && a.unlocked_at && a.unlocked_at >= since);
  }
  return c.json(list);
});

// ===== Stats =====
studyRoutes.get('/stats/today', async (c) => {
  const user = c.get('user');
  const row = await queryOne<{ c: string }>(
    `select count(*)::text as c from public.answers where user_id = $1 and answered_at >= $2::timestamptz`,
    [user.id, startOfDayISO(todaySP())],
  );
  return c.json({ count: Number(row?.c ?? 0) });
});

studyRoutes.get('/stats/studied-dates', async (c) => {
  const user = c.get('user');
  const days = Math.max(1, Math.min(90, Number(c.req.query('days') || 30)));
  const from = startOfDayISO(addDays(todaySP(), -(days - 1)));
  const rows = await query<{ started_at: string }>(
    `select started_at from public.sessions
     where user_id = $1 and finished_at is not null and started_at >= $2::timestamptz`,
    [user.id, from],
  );
  return c.json([...new Set(rows.map((r) => spDate(r.started_at)))]);
});

studyRoutes.get('/stats/weak-spots', async (c) => {
  const user = c.get('user');
  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const rows = await query<{ topic: string; subject_id: string; correct: string; wrong: string }>(
    `select coalesce(q.topic, 'Geral') as topic,
            min(q.subject_id::text) as subject_id,
            sum(case when a.correct then 1 else 0 end)::text as correct,
            sum(case when a.correct then 0 else 1 end)::text as wrong
     from public.answers a
     join public.questions q on q.id = a.question_id
     where a.user_id = $1 and a.answered_at >= $2::timestamptz
     group by coalesce(q.topic, 'Geral')
     having sum(case when a.correct then 0 else 1 end) > 0
     order by sum(case when a.correct then 0 else 1 end) desc`,
    [user.id, from],
  );
  return c.json(
    rows.map((r) => {
      const correct = Number(r.correct);
      const wrong = Number(r.wrong);
      const of = correct + wrong;
      return { topic: r.topic, subject_id: r.subject_id, wrong, of, accuracy: of ? correct / of : 0 };
    }),
  );
});

studyRoutes.get('/stats/overview', async (c) => {
  const user = c.get('user');
  const weekDays = lastNDates(7);
  const days14 = lastNDates(14);

  const [totals, weekRows, subjPerfRows, recentRows, coverageRow, consRows, progRow] = await Promise.all([
    queryOne<{ total: string; correct: string }>(
      `select count(*)::text as total,
              sum(case when correct then 1 else 0 end)::text as correct
       from public.answers where user_id = $1`,
      [user.id],
    ),
    query<{ correct: boolean; answered_at: string }>(
      `select correct, answered_at from public.answers where user_id = $1 and answered_at >= $2::timestamptz`,
      [user.id, startOfDayISO(weekDays[0])],
    ),
    query<{ subject_id: string; correct: string; total: string }>(
      `select q.subject_id::text as subject_id,
              sum(case when a.correct then 1 else 0 end)::text as correct,
              count(*)::text as total
       from public.answers a
       join public.questions q on q.id = a.question_id
       where a.user_id = $1
       group by q.subject_id`,
      [user.id],
    ),
    query<{ correct: boolean; difficulty: number | null }>(
      `select a.correct, q.difficulty
       from public.answers a
       left join public.questions q on q.id = a.question_id
       where a.user_id = $1
       order by a.answered_at desc
       limit 100`,
      [user.id],
    ),
    queryOne<{ total_q: string; distinct_ans: string }>(
      `select
         (select count(*) from public.questions q join public.subjects s on s.id = q.subject_id where s.user_id = $1 and s.archived = false)::text as total_q,
         (select count(distinct question_id) from public.answers where user_id = $1)::text as distinct_ans`,
      [user.id],
    ),
    query<{ answered_at: string }>(
      `select answered_at from public.answers where user_id = $1 and answered_at >= $2::timestamptz`,
      [user.id, startOfDayISO(days14[0])],
    ),
    queryOne<{ total: string; high: string }>(
      `select count(*)::text as total,
              sum(case when box >= 4 then 1 else 0 end)::text as high
       from public.question_progress where user_id = $1`,
      [user.id],
    ),
  ]);

  const answered = Number(totals?.total ?? 0);
  const correctTotal = Number(totals?.correct ?? 0);
  const accuracy = answered ? Math.round((correctTotal / answered) * 100) : 0;

  const weekMap = new Map<string, { c: number; t: number }>();
  for (const r of weekRows) {
    const d = spDate(r.answered_at);
    const e = weekMap.get(d) ?? { c: 0, t: 0 };
    e.t++;
    if (r.correct) e.c++;
    weekMap.set(d, e);
  }
  const weeklyAccuracy = weekDays.map((date) => {
    const e = weekMap.get(date);
    return { date, pct: e && e.t ? Math.round((e.c / e.t) * 100) : 0, count: e?.t ?? 0 };
  });

  const subjectPerformance = subjPerfRows.map((r) => {
    const cNum = Number(r.correct);
    const tNum = Number(r.total);
    return { subject_id: r.subject_id, correct: cNum, total: tNum, pct: tNum ? Math.round((cNum / tNum) * 100) : 0 };
  });

  let mastery: number | null = null;
  if (answered >= 10) {
    let num = 0;
    let den = 0;
    recentRows.forEach((r, i) => {
      const w = (recentRows.length - i) * (r.difficulty ?? 2);
      den += w;
      if (r.correct) num += w;
    });
    const recAcc = den ? num / den : 0;
    const tq = Number(coverageRow?.total_q ?? 0);
    const da = Number(coverageRow?.distinct_ans ?? 0);
    const coverage = tq ? Math.min(1, da / tq) : 0;
    const studyDays = new Set(consRows.map((a) => spDate(a.answered_at)));
    const consistency = studyDays.size / 14;
    const progTotal = Number(progRow?.total ?? 0);
    const progHigh = Number(progRow?.high ?? 0);
    const retention = progTotal ? progHigh / progTotal : 0;
    mastery = Math.max(0, Math.min(100, Math.round((0.5 * recAcc + 0.2 * coverage + 0.15 * consistency + 0.15 * retention) * 100)));
  }

  return c.json({ answered, accuracy, weeklyAccuracy, mastery, subjectPerformance });
});
