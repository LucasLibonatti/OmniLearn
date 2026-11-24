import { Hono } from 'hono';
import type { AppEnv } from '../auth.js';
import { query, queryOne } from '../db.js';

export const CURRENT_TERMS_VERSION = '2.0';

interface ProfileRow {
  id: string;
  name: string | null;
  xp: number | null;
  streak: number | null;
  last_study_date: string | Date | null;
  avatar_url: string | null;
  daily_goal: number | null;
  terms_version: string | null;
  terms_accepted_at: string | Date | null;
  privacy_accepted_at: string | Date | null;
}

function formatDateOnly(v: string | Date | null): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

function toProfile(r: ProfileRow) {
  const xp = r.xp ?? 0;
  return {
    id: r.id,
    name: r.name ?? 'Estudante',
    xp,
    streak: r.streak ?? 0,
    level: Math.floor(xp / 1000) + 1,
    last_study_date: formatDateOnly(r.last_study_date),
    avatar_url: r.avatar_url,
    daily_goal: r.daily_goal ?? 18,
    terms_version: r.terms_version,
    terms_accepted_at: r.terms_accepted_at ? new Date(r.terms_accepted_at).toISOString() : null,
    privacy_accepted_at: r.privacy_accepted_at ? new Date(r.privacy_accepted_at).toISOString() : null,
  };
}

const COLS =
  'id, name, xp, streak, last_study_date, avatar_url, daily_goal, terms_version, terms_accepted_at, privacy_accepted_at';

export const profileRoutes = new Hono<AppEnv>();

profileRoutes.get('/', async (c) => {
  const user = c.get('user');
  let row = await queryOne<ProfileRow>(`select ${COLS} from public.profiles where id = $1`, [user.id]);
  if (!row) {
    const fallback = user.name?.trim() || user.email?.split('@')[0] || 'Estudante';
    row = await queryOne<ProfileRow>(
      `insert into public.profiles (id, name, avatar_url)
       values ($1, $2, $3)
       on conflict (id) do update set id = excluded.id
       returning ${COLS}`,
      [user.id, fallback, user.image ?? null],
    );
  }
  return c.json(row ? toProfile(row) : null);
});

profileRoutes.patch('/', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; daily_goal?: number };
  const updates: string[] = [];
  const params: unknown[] = [];

  if (typeof body.name === 'string') {
    const cleanName = body.name.trim().slice(0, 80);
    if (!cleanName) return c.json({ error: 'Informe um nome válido.' }, 400);
    params.push(cleanName);
    updates.push(`name = $${params.length}`);
  }

  if (typeof body.daily_goal === 'number' && Number.isFinite(body.daily_goal)) {
    const safe = Math.max(5, Math.min(100, Math.round(body.daily_goal)));
    params.push(safe);
    updates.push(`daily_goal = $${params.length}`);
  }

  if (!updates.length) return c.json({ error: 'Nenhuma alteração enviada.' }, 400);

  params.push(user.id);
  const row = await queryOne<ProfileRow>(
    `update public.profiles set ${updates.join(', ')} where id = $${params.length} returning ${COLS}`,
    params,
  );
  if (typeof body.name === 'string' && body.name.trim()) {
    await query(`update public."user" set name = $1, "updatedAt" = now() where id = $2`, [
      body.name.trim().slice(0, 80),
      user.id,
    ]);
  }
  return c.json(row ? toProfile(row) : null);
});

profileRoutes.post('/avatar', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as { dataUrl?: string };
  const dataUrl = body.dataUrl ?? '';
  if (!/^data:image\/(webp|png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
    return c.json({ error: 'Formato de imagem inválido.' }, 400);
  }
  if (dataUrl.length > 220_000) {
    return c.json({ error: 'Imagem muito grande após compressão. Tente outra foto.' }, 400);
  }
  await query(`update public.profiles set avatar_url = $1 where id = $2`, [dataUrl, user.id]);
  return c.json({ avatar_url: dataUrl });
});

profileRoutes.post('/consent', async (c) => {
  const user = c.get('user');
  const body = (await c.req.json().catch(() => ({}))) as { version?: string };
  const version = (body.version || CURRENT_TERMS_VERSION).slice(0, 20);
  const row = await queryOne<ProfileRow>(
    `insert into public.profiles (id, name, avatar_url, terms_version, terms_accepted_at, privacy_accepted_at)
     values ($1, $2, $3, $4, now(), now())
     on conflict (id) do update set
       terms_version = excluded.terms_version,
       terms_accepted_at = now(),
       privacy_accepted_at = now()
     returning ${COLS}`,
    [user.id, user.name || user.email.split('@')[0] || 'Estudante', user.image ?? null, version],
  );
  return c.json(row ? toProfile(row) : null);
});
