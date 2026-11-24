import { betterAuth } from 'better-auth';
import type { Context, Next } from 'hono';
import { getPool, query } from './db.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};

let authInstance: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    database: getPool(),
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET || 'dev-only-secret-change-in-production-32chars',
    trustedOrigins: [
      baseURL,
      'http://localhost:5173',
      'http://localhost:4173',
      'https://educacao-eficiente.vercel.app',
    ].filter(Boolean),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      autoSignIn: true,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              const name = user.name?.trim() || user.email?.split('@')[0] || 'Estudante';
              await query(
                `insert into public.profiles (id, name, avatar_url)
                 values ($1, $2, $3)
                 on conflict (id) do nothing`,
                [user.id, name, user.image ?? null],
              );
            } catch (err) {
              console.error('Failed to auto-create profile:', err);
            }
          },
        },
      },
    },
  });
}

export function getAuth() {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}

export async function getOptionalUser(c: Context): Promise<AuthUser | null> {
  try {
    const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const user = await getOptionalUser(c);
  if (!user) {
    return c.json({ error: 'Sessão expirada ou não autenticada. Faça login novamente.' }, 401);
  }
  c.set('user', user);
  await next();
}
