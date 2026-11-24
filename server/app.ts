import { Hono } from 'hono';
import { getAuth, requireAuth, type AppEnv } from './auth.js';
import { profileRoutes } from './routes/profile.js';
import { subjectsRoutes } from './routes/subjects.js';
import { sessionsRoutes } from './routes/sessions.js';
import { studyRoutes } from './routes/study.js';
import { aiRoutes } from './routes/ai.js';
import { accountRoutes, supportRoute } from './routes/account.js';

export const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ ok: true, db: Boolean(process.env.DATABASE_URL) }));

// Better Auth (E-mail/Senha + Google OAuth)
app.on(['POST', 'GET'], '/auth/*', (c) => getAuth().handler(c.req.raw));

// Suporte (público ou autenticado)
app.route('/support', supportRoute);

// Rotas autenticadas
const authed = new Hono<AppEnv>();
authed.use('*', requireAuth);
authed.route('/profile', profileRoutes);
authed.route('/subjects', subjectsRoutes);
authed.route('/sessions', sessionsRoutes);
authed.route('/study', studyRoutes);
authed.route('/ai', aiRoutes);
authed.route('/account', accountRoutes);

app.route('/', authed);

app.onError((err, c) => {
  console.error('API unhandled error:', err);
  return c.json({ error: 'Erro interno do servidor. Tente novamente em instantes.' }, 500);
});
