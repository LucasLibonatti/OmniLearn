import { Hono } from 'hono';
import { getOptionalUser, type AppEnv } from '../auth.js';
import { query, queryOne } from '../db.js';

export const accountRoutes = new Hono<AppEnv>();

/** LGPD Art. 18, II e V: exportação estruturada em JSON de todos os dados pessoais do titular. */
accountRoutes.get('/export', async (c) => {
  const user = c.get('user');
  const [profile, subjects, materials, sessions, answers, achievements, supportMessages] = await Promise.all([
    queryOne(
      `select id, name, xp, streak, last_study_date, daily_goal, terms_version, terms_accepted_at, privacy_accepted_at, created_at
       from public.profiles where id = $1`,
      [user.id],
    ),
    query(`select id, name, topic, archived, created_at from public.subjects where user_id = $1 order by created_at desc`, [
      user.id,
    ]),
    query(
      `select id, subject_id, file_name, pages, status, char_count, created_at from public.materials where user_id = $1 order by created_at desc`,
      [user.id],
    ),
    query(
      `select id, subject_id, mode, topic_filter, planned_questions, minutes, started_at, finished_at, correct, total, xp_gained
       from public.sessions where user_id = $1 order by started_at desc`,
      [user.id],
    ),
    query(
      `select id, question_id, session_id, correct, xp_gained, attempt_text, time_ms, answered_at
       from public.answers where user_id = $1 order by answered_at desc`,
      [user.id],
    ),
    query(
      `select ua.achievement_id, a.title, ua.unlocked_at
       from public.user_achievements ua
       join public.achievements a on a.id = ua.achievement_id
       where ua.user_id = $1`,
      [user.id],
    ),
    query(
      `select id, subject, message, created_at
       from public.support_messages
       where user_id = $1 or lower(email) = lower($2)
       order by created_at desc`,
      [user.id, user.email],
    ),
  ]);

  return c.json({
    exported_at: new Date().toISOString(),
    service: 'OmniLearn',
    legal_basis: 'LGPD — Art. 18, II e V (Acesso e Portabilidade)',
    user: { id: user.id, name: user.name, email: user.email },
    profile,
    subjects,
    materials,
    sessions,
    answers,
    achievements,
    support_messages: supportMessages,
  });
});

/** LGPD Art. 18, VI: eliminação definitiva da conta e de TODOS os dados associados. */
accountRoutes.delete('/', async (c) => {
  const user = c.get('user');
  try {
    await query(`delete from public.support_messages where user_id = $1 or lower(email) = lower($2)`, [
      user.id,
      user.email,
    ]);
    await query(`delete from public."user" where id = $1`, [user.id]);
    return c.json({ ok: true });
  } catch (err) {
    console.error('delete account error:', err);
    return c.json({ error: 'Não foi possível excluir sua conta agora. Tente novamente.' }, 500);
  }
});

export const supportRoute = new Hono();

supportRoute.post('/', async (c) => {
  const user = await getOptionalUser(c);
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
  const message = (body.message ?? '').trim();
  if (message.length < 5) {
    return c.json({ error: 'Escreva um pouco mais sobre o que você precisa.' }, 400);
  }
  if (message.length > 5000) {
    return c.json({ error: 'Mensagem muito longa (máximo 5.000 caracteres).' }, 400);
  }
  await query(
    `insert into public.support_messages (user_id, name, email, subject, message)
     values ($1, $2, $3, $4, $5)`,
    [
      user?.id ?? null,
      body.name?.trim().slice(0, 120) || null,
      body.email?.trim().slice(0, 160) || user?.email || null,
      body.subject?.trim().slice(0, 160) || null,
      message,
    ],
  );
  return c.json({ ok: true }, 201);
});
